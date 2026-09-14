const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, createProduct } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Concurrency — no overselling', () => {
  test('assessment case: stock 10, A wants 7 and B wants 6 -> only one succeeds', async () => {
    const p = await createProduct({ availableStock: 10 });

    const [a, b] = await Promise.all([
      request(app).post('/api/orders').send({ items: [{ productId: p.id, quantity: 7 }] }),
      request(app).post('/api/orders').send({ items: [{ productId: p.id, quantity: 6 }] }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]); // exactly one succeeds

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBeGreaterThanOrEqual(0); // never negative
    expect(after.availableStock + after.reservedStock).toBe(10);
  });

  test('20 concurrent buyers of 1 unit against stock 10 -> exactly 10 succeed', async () => {
    const p = await createProduct({ availableStock: 10 });

    const reqs = Array.from({ length: 20 }, () =>
      request(app).post('/api/orders').send({ items: [{ productId: p.id, quantity: 1 }] })
    );
    const results = await Promise.all(reqs);
    const succeeded = results.filter((r) => r.status === 201).length;

    expect(succeeded).toBe(10);

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBe(0);
    expect(after.reservedStock).toBe(10);
  });

  test('mixed quantities never oversell', async () => {
    const p = await createProduct({ availableStock: 30 });

    const reqs = Array.from({ length: 40 }, (_, i) =>
      request(app)
        .post('/api/orders')
        .send({ items: [{ productId: p.id, quantity: 1 + (i % 3) }] })
    );
    const results = await Promise.all(reqs);

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBeGreaterThanOrEqual(0);
    expect(after.reservedStock).toBeLessThanOrEqual(30);
    expect(after.availableStock + after.reservedStock).toBe(30);
  });
});
