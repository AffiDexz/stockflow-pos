const prisma = require('../lib/prisma');
const { badRequest, notFound, conflict } = require('../utils/errors');
const {
  confirmReservations,
  releaseReservations,
} = require('./reservationService');

const OUTCOMES = ['success', 'failure', 'timeout'];

/**
 * Process a mock payment for an order.
 *
 * Duplicate-payment prevention (idempotency):
 *   - Every request carries an idempotency key (header `Idempotency-Key` or body).
 *   - `Payment.idempotencyKey` is UNIQUE in the database.
 *   - If the same key is seen again we return the ORIGINAL result without
 *     touching stock or the order again (a safe replay — no double charge).
 *   - If two identical requests race, the unique constraint lets exactly one
 *     insert win; the loser rolls back and is served the original result.
 *   - A *different* key against an already-PAID order is rejected as a
 *     duplicate order/payment attempt.
 *
 * Outcome handling:
 *   success -> order PAID,    reservations CONFIRMED (stock consumed)
 *   failure -> order FAILED,  reservations RELEASED  (stock restored)
 *   timeout -> order EXPIRED, reservations EXPIRED   (stock restored)
 */
async function processPayment(orderId, outcome, idempotencyKey) {
  if (!OUTCOMES.includes(outcome)) {
    throw badRequest(`outcome must be one of: ${OUTCOMES.join(', ')}.`);
  }
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw badRequest('An Idempotency-Key is required for payments.');
  }

  // Fast path: this exact request was already processed — replay the result.
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey },
    include: { order: true },
  });
  if (existing) {
    if (existing.orderId !== orderId) {
      throw conflict('This Idempotency-Key was already used for another order.');
    }
    return { payment: existing, order: existing.order, replayed: true };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw notFound('Order not found.');

      // Only a reserved order can be paid. Anything else is an invalid attempt.
      if (order.status !== 'RESERVED') {
        if (order.status === 'PAID') {
          throw conflict('Order has already been paid.');
        }
        throw conflict(
          `Cannot pay an order in status ${order.status}.`
        );
      }

      let orderStatus;
      let paymentStatus;

      if (outcome === 'success') {
        await confirmReservations(tx, orderId);
        orderStatus = 'PAID';
        paymentStatus = 'SUCCESS';
      } else if (outcome === 'failure') {
        await releaseReservations(tx, orderId, 'RELEASED');
        orderStatus = 'FAILED';
        paymentStatus = 'FAILED';
      } else {
        // timeout
        await releaseReservations(tx, orderId, 'EXPIRED');
        orderStatus = 'EXPIRED';
        paymentStatus = 'TIMEOUT';
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
        include: { items: true, reservations: true },
      });

      // The UNIQUE idempotencyKey makes this insert the atomic guard against
      // concurrent duplicate submissions.
      const payment = await tx.payment.create({
        data: {
          orderId,
          idempotencyKey,
          amount: order.totalAmount,
          status: paymentStatus,
        },
      });

      return { payment, order: updatedOrder, replayed: false };
    });

    return result;
  } catch (err) {
    // Lost a concurrent race on the same key — serve the winner's result.
    if (err.code === 'P2002') {
      const winner = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { order: true },
      });
      if (winner) {
        return { payment: winner, order: winner.order, replayed: true };
      }
    }
    throw err;
  }
}

module.exports = { processPayment, OUTCOMES };
