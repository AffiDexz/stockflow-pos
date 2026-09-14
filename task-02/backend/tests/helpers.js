const prisma = require('../src/lib/prisma');

async function resetDb() {
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
}

let catCounter = 0;
async function createCategory(name = 'Test') {
  catCounter += 1;
  return prisma.category.create({ data: { name, slug: `test-cat-${Date.now()}-${catCounter}` } });
}

async function createProduct(overrides = {}) {
  let categoryId = overrides.categoryId;
  if (!categoryId) categoryId = (await createCategory()).id;
  return prisma.product.create({
    data: {
      name: 'Test Product',
      price: '100.00',
      availableStock: 10,
      reservedStock: 0,
      categoryId,
      ...overrides,
    },
  });
}

module.exports = { prisma, resetDb, createCategory, createProduct };
