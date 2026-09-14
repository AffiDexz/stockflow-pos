require('dotenv').config();
const prisma = require('../src/lib/prisma');

const categories = [
  { name: 'Audio', slug: 'audio' },
  { name: 'Wearables', slug: 'wearables' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home', slug: 'home' },
];

// 👉 In-stock products keep your image links. Out-of-stock ones have imageUrl: '' — paste links there if you want.
const productsByCat = {
  audio: [
    { name: 'Wireless Headphones', price: '12000.00', availableStock: 40, imageUrl: 'https://plus.unsplash.com/premium_photo-1679513691474-73102089c117?q=80&w=1113&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Over-ear wireless headphones with active noise cancellation and 30-hour battery life.' },
    { name: 'Bluetooth Speaker', price: '7500.00', availableStock: 55, imageUrl: 'https://images.unsplash.com/photo-1547052178-7f2c5a20c332?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Portable waterproof Bluetooth speaker with deep bass and 12-hour playback.' },
    { name: 'Wireless Earbuds', price: '5500.00', availableStock: 80, imageUrl: 'https://images.unsplash.com/photo-1655560378428-7605bda51749?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Compact true-wireless earbuds with touch controls and a charging case.' },
    { name: 'Limited Edition Speaker', price: '18000.00', availableStock: 10, imageUrl: 'https://images.unsplash.com/photo-1699456537100-4db851dd26c8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Collector edition speaker — very limited stock. Great for testing concurrency.' },
    { name: 'Studio Monitor Headphones', price: '15500.00', availableStock: 0, imageUrl: 'https://images.unsplash.com/photo-1646500366920-b4c5ce29237d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Professional studio monitoring headphones with flat frequency response. Currently out of stock.' },
  ],
  wearables: [
    { name: 'Smart Watch', price: '32000.00', availableStock: 25, imageUrl: 'https://images.unsplash.com/photo-1617043983671-adaadcaa2460?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Fitness smartwatch with heart-rate, GPS and AMOLED display.' },
    { name: 'Fitness Band', price: '6500.00', availableStock: 60, imageUrl: 'https://plus.unsplash.com/premium_photo-1681433383783-661b519b154a?q=80&w=1460&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Slim fitness tracker with step, sleep and heart-rate monitoring.' },
    { name: 'Smart Ring', price: '21000.00', availableStock: 0, imageUrl: 'https://images.unsplash.com/photo-1758577515333-e71b713059f1?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Health-tracking smart ring with sleep and activity monitoring. Currently out of stock.' },
  ],
  accessories: [
    { name: 'Laptop Backpack', price: '4500.00', availableStock: 45, imageUrl: 'https://images.unsplash.com/photo-1667411424771-cadd97150827?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Water-resistant backpack with padded laptop compartment and USB pass-through.' },
    { name: 'Wireless Mouse', price: '2200.00', availableStock: 120, imageUrl: 'https://images.unsplash.com/photo-1632160871990-be30194885aa?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Ergonomic wireless mouse with silent clicks and long battery life.' },
    { name: 'Mechanical Keyboard', price: '9800.00', availableStock: 35, imageUrl: 'https://images.unsplash.com/photo-1664813398575-819b46e5ab8d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Hot-swappable mechanical keyboard with RGB backlight.' },
    { name: 'USB-C Charger', price: '3500.00', availableStock: 90, imageUrl: 'https://images.unsplash.com/photo-1660921436563-65ec990056e5?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: '65W fast GaN charger with dual USB-C ports.' },
    { name: 'Aluminium Laptop Stand', price: '4800.00', availableStock: 0, imageUrl: 'https://plus.unsplash.com/premium_photo-1683736986821-e4662912a70d?q=80&w=1029&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Adjustable aluminium laptop stand for better ergonomics. Currently out of stock.' },
  ],
  electronics: [
    { name: 'Power Bank 20000mAh', price: '5900.00', availableStock: 70, imageUrl: 'https://images.unsplash.com/photo-1706275399494-fb26bbc5da63?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'High-capacity power bank with fast charging and dual output.' },
    { name: 'HD Webcam', price: '8200.00', availableStock: 30, imageUrl: 'https://images.unsplash.com/photo-1636569826709-8e07f6104992?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: '1080p webcam with auto-focus and built-in microphone.' },
    { name: '4K Action Camera', price: '26500.00', availableStock: 0, imageUrl: 'https://images.unsplash.com/photo-1772650714062-629cf1ce12d3?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Waterproof 4K action camera with image stabilisation. Currently out of stock.' },
  ],
  home: [
    { name: 'LED Desk Lamp', price: '4200.00', availableStock: 50, imageUrl: 'https://images.unsplash.com/photo-1592778024290-548bcd706e33?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Dimmable LED desk lamp with adjustable colour temperature.' },
  ],
};

async function main() {
  console.log('Seeding ShopFlow database...');

  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const catMap = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catMap[c.slug] = created.id;
  }

  let count = 0;
  for (const [slug, products] of Object.entries(productsByCat)) {
    for (const p of products) {
      await prisma.product.create({
        data: {
          ...p,
          imageUrl: p.imageUrl || null,
          reservedStock: 0,
          categoryId: catMap[slug],
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${categories.length} categories and ${count} products.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });