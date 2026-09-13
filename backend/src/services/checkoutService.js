const prisma = require('../lib/prisma');
const { badRequest, notFound, conflict } = require('../utils/errors');
const {
  RESERVATION_MS,
  generateOrderReference,
  isPositiveInt,
} = require('../utils/helpers');

/**
 * Create an order and reserve stock — safely, even under concurrent load.
 *
 * How overselling is prevented:
 *   1. We open a single database transaction.
 *   2. Inside it we run `SELECT ... FOR UPDATE` on each product row. This takes
 *      an exclusive row-level lock, so any other checkout touching the same
 *      product must WAIT until this transaction commits or rolls back.
 *   3. Only after we hold the lock do we read the stock, validate it, and
 *      decrement it. A competing request can never read a stale value.
 *   4. Product rows are locked in ascending id order to avoid deadlocks when
 *      an order contains several products.
 *
 * The read -> check -> write sequence is therefore atomic per product, which
 * makes it impossible for two orders to both succeed against the same last unit.
 *
 * @param {Array<{productId:number, quantity:number}>} items
 * @param {string} [customer]
 */
async function createOrder(items, customer = 'Guest') {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Order must contain at least one item.');
  }

  // Normalise + validate input, and merge duplicate product lines.
  const merged = new Map();
  for (const raw of items) {
    const productId = Number(raw.productId);
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw badRequest('Each item needs a valid productId.');
    }
    if (!isPositiveInt(quantity)) {
      throw badRequest('Quantity must be a positive whole number.');
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  // Consistent lock ordering (ascending id) prevents deadlocks.
  const lines = [...merged.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId - b.productId);

  const order = await prisma.$transaction(
    async (tx) => {
      let totalCents = 0;
      const orderItemsData = [];
      const reservationsData = [];

      for (const line of lines) {
        // ---- Lock the product row for the lifetime of this transaction ----
        const rows = await tx.$queryRaw`
          SELECT id, name, price, availableStock
          FROM products
          WHERE id = ${line.productId}
          FOR UPDATE
        `;

        if (rows.length === 0) {
          throw notFound(`Product ${line.productId} not found.`);
        }

        const product = rows[0];
        const available = Number(product.availableStock);

        // ---- Validate stock while holding the lock ----
        if (available < line.quantity) {
          throw conflict(
            `Insufficient stock for "${product.name}". Available: ${available}, requested: ${line.quantity}.`
          );
        }

        // ---- Reserve: move units from available -> reserved ----
        await tx.product.update({
          where: { id: line.productId },
          data: {
            availableStock: { decrement: line.quantity },
            reservedStock: { increment: line.quantity },
          },
        });

        const unitCents = Math.round(Number(product.price) * 100);
        totalCents += unitCents * line.quantity;

        orderItemsData.push({
          productId: line.productId,
          name: product.name,
          unitPrice: product.price,
          quantity: line.quantity,
        });

        reservationsData.push({
          productId: line.productId,
          quantity: line.quantity,
        });
      }

      const expiresAt = new Date(Date.now() + RESERVATION_MS);
      const totalAmount = (totalCents / 100).toFixed(2);

      // ---- Create order, its items and its reservations atomically ----
      const created = await tx.order.create({
        data: {
          reference: generateOrderReference(),
          customer,
          status: 'RESERVED',
          totalAmount,
          items: { create: orderItemsData },
          reservations: {
            create: reservationsData.map((r) => ({
              productId: r.productId,
              quantity: r.quantity,
              status: 'ACTIVE',
              expiresAt,
            })),
          },
        },
        include: { items: true, reservations: true },
      });

      return created;
    },
    {
      // Give locked rows time to be released by competing transactions.
      timeout: 15000,
      maxWait: 15000,
    }
  );

  return order;
}

module.exports = { createOrder };
