const prisma = require('../lib/prisma');
const { notFound } = require('../utils/errors');
const { createOrder } = require('../services/checkoutService');
const { cancelOrder } = require('../services/orderService');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const orderInclude = {
  items: true,
  reservations: { orderBy: { id: 'asc' } },
  payments: { orderBy: { id: 'asc' } },
  refunds: { orderBy: { id: 'asc' } },
};

// POST /api/orders — checkout: validate stock, create order, reserve stock.
const create = wrap(async (req, res) => {
  const { items, customer } = req.body;
  const order = await createOrder(items, customer);
  res.status(201).json(order);
});

const list = wrap(async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
  });
  res.json(orders);
});

const getOne = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw notFound('Order not found.');
  res.json(order);
});

const cancel = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const result = await cancelOrder(id);
  res.json(result);
});

module.exports = { create, list, getOne, cancel };
