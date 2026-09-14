const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, createProduct } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Order creation & cancellation', () => {
  test('creates an order and reserves stock', async () => {
    const p = await createProduct({ availableStock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 3 }], customer: 'Nimal' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('RESERVED');
    expect(res.body.reservations).toHaveLength(1);

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBe(7); // reserved out of available
    expect(after.reservedStock).toBe(3);
  });

  test('rejects an order that exceeds stock', async () => {
    const p = await createProduct({ availableStock: 2 });
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 5 }] });

    expect(res.status).toBe(409);
    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBe(2); // unchanged — rolled back
  });

  test('rejects invalid quantity', async () => {
    const p = await createProduct();
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 0 }] });
    expect(res.status).toBe(400);
  });

  test('cancels a reserved order and restores stock', async () => {
    const p = await createProduct({ availableStock: 10 });
    const order = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 4 }] });

    const res = await request(app).post(`/api/orders/${order.body.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('CANCELLED');

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBe(10);
    expect(after.reservedStock).toBe(0);
  });

  test('rejects cancelling an already-expired order', async () => {
    const p = await createProduct();
    const order = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 1 }] });
    // Force it into EXPIRED.
    await prisma.order.update({
      where: { id: order.body.id },
      data: { status: 'EXPIRED' },
    });
    const res = await request(app).post(`/api/orders/${order.body.id}/cancel`);
    expect(res.status).toBe(409);
  });
});
