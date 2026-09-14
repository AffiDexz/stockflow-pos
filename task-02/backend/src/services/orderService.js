const prisma = require('../lib/prisma');
const { notFound, conflict } = require('../utils/errors');
const { releaseReservations } = require('./reservationService');

/**
 * Cancel an order and keep inventory consistent.
 *
 *   RESERVED -> CANCELLED : release active reservations, return stock to shelf.
 *   PAID     -> REFUNDED  : restore sold stock and create a simulated refund.
 *
 * Any other status (FAILED / EXPIRED / CANCELLED / REFUNDED) is rejected.
 */
async function cancelOrder(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw notFound('Order not found.');

    let newStatus;
    let refund = null;

    if (order.status === 'RESERVED') {
      await releaseReservations(tx, orderId, 'RELEASED');
      newStatus = 'CANCELLED';
    } else if (order.status === 'PAID') {
      // Stock was consumed on confirmation — put it back.
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { availableStock: { increment: item.quantity } },
        });
      }
      // Simulate the refund.
      refund = await tx.refund.create({
        data: { orderId, amount: order.totalAmount, status: 'Simulated Refund Successful' },
      });
      newStatus = 'REFUNDED';
    } else {
      throw conflict(`An order in status ${order.status} cannot be cancelled.`);
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true, reservations: true, payments: true, refunds: true },
    });

    return { order: updated, refund, refundSimulated: !!refund };
  });
}

module.exports = { cancelOrder };
