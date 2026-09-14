const prisma = require('../lib/prisma');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/dashboard — figures for the dashboard cards + recent orders.
const stats = wrap(async (req, res) => {
  const [
    totalProducts,
    stockAgg,
    activeReservations,
    totalOrders,
    paidOrders,
    statusGroups,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { availableStock: true, reservedStock: true } }),
    prisma.reservation.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count(),
    prisma.order.findMany({ where: { status: 'PAID' }, select: { totalAmount: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { payments: { orderBy: { id: 'desc' }, take: 1 } },
    }),
  ]);

  const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const statusCounts = statusGroups.reduce((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});

  res.json({
    totalProducts,
    availableStock: stockAgg._sum.availableStock || 0,
    reservedStock: stockAgg._sum.reservedStock || 0,
    activeReservations,
    totalOrders,
    totalSales: totalSales.toFixed(2),
    statusCounts,
    recentOrders,
  });
});

module.exports = { stats };
