const prisma = require('../lib/prisma');
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const list = wrap(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

module.exports = { list };
