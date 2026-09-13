const prisma = require('../src/lib/prisma');

// Wipe all tables in FK-safe order between tests.
async function resetDb() {
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
}

async function createProduct(overrides = {}) {
  return prisma.product.create({
    data: {
      name: 'Test Product',
      price: '100.00',
      availableStock: 10,
      reservedStock: 0,
      ...overrides,
    },
  });
}

module.exports = { prisma, resetDb, createProduct };
