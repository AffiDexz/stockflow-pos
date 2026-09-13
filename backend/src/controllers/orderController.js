const prisma = require('../lib/prisma');
const { notFound } = require('../utils/errors');
const { createOrder } = require('../services/checkoutService');
const { cancelOrder } = require('../services/orderService');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const orderInclude = {
  items: true,
  reservations: { orderBy: { id: 'asc' } },
  payments: { orderBy: { id: 'asc' } },
};

// POST /api/orders  — checkout: validate stock, create order, reserve stock.
// Accepts { items: [{ productId, quantity }], customer? } or a { cartId }.
const create = wrap(async (req, res) => {
  let { items, customer, cartId } = req.body;

  if (cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
    if (!cart) throw notFound('Cart not found.');
    items = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  }

  const order = await createOrder(items, customer);

  // Clear the cart once it has been turned into an order.
  if (cartId) {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }

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
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) throw notFound('Order not found.');
  res.json(order);
});

const cancel = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const { order, refundSimulated } = await cancelOrder(id);
  res.json({ order, refundSimulated });
});

module.exports = { create, list, getOne, cancel };
