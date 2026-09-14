const prisma = require('../lib/prisma');
const { badRequest, notFound } = require('../utils/errors');

// Wrap async controllers so thrown errors reach the error middleware.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const list = wrap(async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  res.json(products);
});

const getOne = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw notFound('Product not found.');
  res.json(product);
});

const create = wrap(async (req, res) => {
  const { name, price, availableStock, imageUrl } = req.body;
  if (!name || typeof name !== 'string') throw badRequest('name is required.');
  if (price == null || Number(price) < 0) throw badRequest('price must be >= 0.');
  const stock = availableStock == null ? 0 : Number(availableStock);
  if (!Number.isInteger(stock) || stock < 0) {
    throw badRequest('availableStock must be a non-negative integer.');
  }

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      price: Number(price).toFixed(2),
      availableStock: stock,
      imageUrl: imageUrl || null,
    },
  });
  res.status(201).json(product);
});

const update = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw notFound('Product not found.');

  const { name, price, availableStock, imageUrl } = req.body;
  const data = {};
  if (name != null) data.name = String(name).trim();
  if (price != null) {
    if (Number(price) < 0) throw badRequest('price must be >= 0.');
    data.price = Number(price).toFixed(2);
  }
  if (availableStock != null) {
    const stock = Number(availableStock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw badRequest('availableStock must be a non-negative integer.');
    }
    data.availableStock = stock;
  }
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

  const product = await prisma.product.update({ where: { id }, data });
  res.json(product);
});

const remove = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw notFound('Product not found.');
  await prisma.product.delete({ where: { id } });
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
