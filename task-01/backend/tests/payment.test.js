const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, createProduct } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function makeOrder(qty = 3, stock = 10) {
  const p = await createProduct({ availableStock: stock });
  const order = await request(app)
    .post('/api/orders')
    .send({ items: [{ productId: p.id, quantity: qty }] });
  return { product: p, order: order.body };
}

describe('Mock payment outcomes', () => {
  test('success -> order PAID, reservation CONFIRMED, stock consumed', async () => {
    const { product, order } = await makeOrder(3, 10);
    const res = await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send({ outcome: 'success', idempotencyKey: 'key-success-1' });

    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('PAID');

    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after.availableStock).toBe(7); // sold, not returned
    expect(after.reservedStock).toBe(0);
  });

  test('failure -> order FAILED, stock restored', async () => {
    const { product, order } = await makeOrder(3, 10);
    const res = await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send({ outcome: 'failure', idempotencyKey: 'key-fail-1' });

    expect(res.body.order.status).toBe('FAILED');
    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after.availableStock).toBe(10);
    expect(after.reservedStock).toBe(0);
  });

  test('timeout -> order EXPIRED, stock restored', async () => {
    const { product, order } = await makeOrder(3, 10);
    const res = await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send({ outcome: 'timeout', idempotencyKey: 'key-timeout-1' });

    expect(res.body.order.status).toBe('EXPIRED');
    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after.availableStock).toBe(10);
    expect(after.reservedStock).toBe(0);
  });
});

describe('Duplicate payment prevention (idempotency)', () => {
  test('same idempotency key does not charge twice or duplicate the effect', async () => {
    const { product, order } = await makeOrder(3, 10);
    const body = { outcome: 'success', idempotencyKey: 'dup-key-1' };

    const first = await request(app).post(`/api/orders/${order.id}/payment`).send(body);
    const second = await request(app).post(`/api/orders/${order.id}/payment`).send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.replayed).toBe(true);
    expect(second.body.payment.id).toBe(first.body.payment.id);

    const payments = await prisma.payment.count({ where: { orderId: order.id } });
    expect(payments).toBe(1); // only one payment record

    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after.availableStock).toBe(7); // stock only consumed once
  });

  test('concurrent identical payments create only one payment', async () => {
    const { order } = await makeOrder(3, 10);
    const body = { outcome: 'success', idempotencyKey: 'race-key-1' };

    await Promise.all([
      request(app).post(`/api/orders/${order.id}/payment`).send(body),
      request(app).post(`/api/orders/${order.id}/payment`).send(body),
      request(app).post(`/api/orders/${order.id}/payment`).send(body),
    ]);

    const payments = await prisma.payment.count({ where: { orderId: order.id } });
    expect(payments).toBe(1);
  });

  test('paying an already-paid order with a new key is rejected', async () => {
    const { order } = await makeOrder(3, 10);
    await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send({ outcome: 'success', idempotencyKey: 'first-key' });

    const res = await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send({ outcome: 'success', idempotencyKey: 'second-key' });
    expect(res.status).toBe(409);
  });
});
