const prisma = require('../src/lib/prisma');

const products = [
  { name: 'Wireless Headphones', price: '12000.00', availableStock: 136 },
  { name: 'Smart Watch', price: '32000.00', availableStock: 95 },
  { name: 'Backpack', price: '4500.00', availableStock: 70 },
  { name: 'Wireless Mouse', price: '2200.00', availableStock: 220 },
  { name: 'Mechanical Keyboard', price: '9800.00', availableStock: 105 },
  { name: 'USB-C Charger', price: '3500.00', availableStock: 180 },
  // Low-stock item — perfect for demonstrating concurrency-safe checkout.
  { name: 'Limited Edition Speaker', price: '18000.00', availableStock: 10 },
];

async function main() {
  console.log('Seeding database...');

  // Clean slate (order matters because of foreign keys).
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();

  for (const p of products) {
    await prisma.product.create({ data: { ...p, reservedStock: 0 } });
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
