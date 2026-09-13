const prisma = require('../lib/prisma');
const { notFound, conflict } = require('../utils/errors');
const { releaseReservations } = require('./reservationService');

/**
 * Cancel an order and keep inventory consistent.
 *
 * Valid transitions:
 *   RESERVED -> CANCELLED : release active reservations, return stock to shelf.
 *   PAID     -> CANCELLED : simulate a refund and restore the sold stock.
 *
 * Any other status (FAILED / EXPIRED / already CANCELLED) is rejected.
 */
async function cancelOrder(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw notFound('Order not found.');

    if (order.status === 'RESERVED') {
      // Stock is still only reserved — move it straight back to available.
      await releaseReservations(tx, orderId, 'RELEASED');
    } else if (order.status === 'PAID') {
      // Stock was already consumed on confirmation. Put each sold unit back
      // and simulate the refund.
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { availableStock: { increment: item.quantity } },
        });
      }
    } else {
      throw conflict(`An order in status ${order.status} cannot be cancelled.`);
    }

    const refundSimulated = order.status === 'PAID';

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { items: true, reservations: true, payments: true },
    });

    return { order: updated, refundSimulated };
  });
}

module.exports = { cancelOrder };
