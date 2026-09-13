const { processPayment } = require('../services/paymentService');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// POST /api/orders/:id/payment
// body: { outcome: 'success' | 'failure' | 'timeout', idempotencyKey? }
// The idempotency key may also be sent as the `Idempotency-Key` header.
const pay = wrap(async (req, res) => {
  const orderId = Number(req.params.id);
  const outcome = req.body.outcome;
  const idempotencyKey =
    req.headers['idempotency-key'] || req.body.idempotencyKey;

  const result = await processPayment(orderId, outcome, idempotencyKey);
  res.status(result.replayed ? 200 : 201).json(result);
});

module.exports = { pay };
