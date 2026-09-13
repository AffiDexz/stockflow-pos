const prisma = require('../lib/prisma');
const { expireDueReservations } = require('../services/reservationService');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/reservations?status=ACTIVE
const list = wrap(async (req, res) => {
  const { status } = req.query;
  const reservations = await prisma.reservation.findMany({
    where: status ? { status } : undefined,
    orderBy: { id: 'desc' },
    include: { product: true, order: true },
  });
  res.json(reservations);
});

// POST /api/reservations/expire
// Manually trigger the expiry sweep — handy for demos and tests without waiting.
const expireNow = wrap(async (req, res) => {
  const result = await expireDueReservations();
  res.json(result);
});

module.exports = { list, expireNow };
