const prisma = require('../lib/prisma');
const { notFound } = require('../utils/errors');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/products?search=&categoryId=&minPrice=&maxPrice=&availability=in_stock|out_of_stock
const list = wrap(async (req, res) => {
  const { search, categoryId, minPrice, maxPrice, availability } = req.query;

  const where = {};
  if (search) where.name = { contains: search };
  if (categoryId) where.categoryId = Number(categoryId);
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (availability === 'in_stock') where.availableStock = { gt: 0 };
  if (availability === 'out_of_stock') where.availableStock = { lte: 0 };

  const products = await prisma.product.findMany({
    where,
    orderBy: { id: 'asc' },
    include: { category: true },
  });
  res.json(products);
});

const getOne = wrap(async (req, res) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) throw notFound('Product not found.');
  res.json(product);
});

module.exports = { list, getOne };
