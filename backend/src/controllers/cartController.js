const prisma = require('../lib/prisma');
const { badRequest, notFound } = require('../utils/errors');
const { isPositiveInt } = require('../utils/helpers');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const cartInclude = {
  items: { include: { product: true }, orderBy: { id: 'asc' } },
};

const createCart = wrap(async (req, res) => {
  const cart = await prisma.cart.create({ data: {}, include: cartInclude });
  res.status(201).json(cart);
});

const getCart = wrap(async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
    include: cartInclude,
  });
  if (!cart) throw notFound('Cart not found.');
  res.json(cart);
});

const addItem = wrap(async (req, res) => {
  const cartId = req.params.id;
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity ?? 1);

  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) throw notFound('Cart not found.');
  if (!Number.isInteger(productId)) throw badRequest('productId is required.');
  if (!isPositiveInt(quantity)) throw badRequest('quantity must be positive.');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound('Product not found.');

  // Upsert: add to existing line or create a new one.
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId, productId, quantity },
  });

  const updated = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  res.status(201).json(updated);
});

const updateItem = wrap(async (req, res) => {
  const cartId = req.params.id;
  const itemId = Number(req.params.itemId);
  const quantity = Number(req.body.quantity);
  if (!isPositiveInt(quantity)) throw badRequest('quantity must be positive.');

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw notFound('Cart item not found.');

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  const updated = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  res.json(updated);
});

const removeItem = wrap(async (req, res) => {
  const cartId = req.params.id;
  const itemId = Number(req.params.itemId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw notFound('Cart item not found.');

  await prisma.cartItem.delete({ where: { id: itemId } });

  const updated = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  res.json(updated);
});

module.exports = { createCart, getCart, addItem, updateItem, removeItem };
