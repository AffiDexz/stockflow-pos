const prisma = require('../lib/prisma');

/**
 * Stock accounting model
 * ----------------------
 *   availableStock : units free to sell
 *   reservedStock  : units held by ACTIVE reservations
 *
 *   checkout  : available -= q ; reserved += q
 *   CONFIRMED : reserved  -= q            (sold — leaves inventory for good)
 *   RELEASED  : reserved  -= q ; available += q  (returned to shelf)
 *   EXPIRED   : reserved  -= q ; available += q  (returned to shelf)
 *
 * All helpers below take a Prisma transaction client `tx` so they run inside
 * the caller's transaction and stay atomic with the order/payment update.
 */

// Confirm every active reservation of an order (payment success).
async function confirmReservations(tx, orderId) {
  const active = await tx.reservation.findMany({
    where: { orderId, status: 'ACTIVE' },
  });
  for (const r of active) {
    await tx.reservation.update({
      where: { id: r.id },
      data: { status: 'CONFIRMED' },
    });
    await tx.product.update({
      where: { id: r.productId },
      data: { reservedStock: { decrement: r.quantity } },
    });
  }
}

// Release every active reservation of an order and return stock to the shelf
// (payment failure or order cancellation). `newStatus` is RELEASED or EXPIRED.
async function releaseReservations(tx, orderId, newStatus = 'RELEASED') {
  const active = await tx.reservation.findMany({
    where: { orderId, status: 'ACTIVE' },
  });
  for (const r of active) {
    await tx.reservation.update({
      where: { id: r.id },
      data: { status: newStatus },
    });
    await tx.product.update({
      where: { id: r.productId },
      data: {
        reservedStock: { decrement: r.quantity },
        availableStock: { increment: r.quantity },
      },
    });
  }
}

/**
 * Expiry sweep — run periodically by the scheduled job.
 * Finds ACTIVE reservations whose 5-minute window has passed, marks them
 * EXPIRED, returns their stock, and moves the parent order to EXPIRED.
 * Each order is processed in its own transaction so one failure can't stall
 * the rest.
 */
async function expireDueReservations(now = new Date()) {
  const due = await prisma.reservation.findMany({
    where: { status: 'ACTIVE', expiresAt: { lte: now } },
    select: { orderId: true },
    distinct: ['orderId'],
  });

  let expiredOrders = 0;

  for (const { orderId } of due) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      // Only expire orders still sitting in RESERVED.
      if (!order || order.status !== 'RESERVED') return;

      await releaseReservations(tx, orderId, 'EXPIRED');
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'EXPIRED' },
      });
      expiredOrders += 1;
    });
  }

  return { expiredOrders };
}

module.exports = {
  confirmReservations,
  releaseReservations,
  expireDueReservations,
};
