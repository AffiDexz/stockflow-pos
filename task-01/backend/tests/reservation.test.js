const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, createProduct } = require('./helpers');
const { expireDueReservations } = require('../src/services/reservationService');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Stock reservation & expiry', () => {
  test('checkout creates an ACTIVE reservation with a 5-minute window', async () => {
    const p = await createProduct({ availableStock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 2 }] });

    const reservation = res.body.reservations[0];
    expect(reservation.status).toBe('ACTIVE');

    const created = new Date(reservation.createdAt).getTime();
    const expires = new Date(reservation.expiresAt).getTime();
    const minutes = Math.round((expires - created) / 60000);
    expect(minutes).toBe(5);
  });

  test('expiry releases reserved stock and expires the order', async () => {
    const p = await createProduct({ availableStock: 10 });
    const order = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 4 }] });

    // Simulate the 5 minutes having passed.
    await prisma.reservation.updateMany({
      where: { orderId: order.body.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await expireDueReservations();
    expect(result.expiredOrders).toBe(1);

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.availableStock).toBe(10); // stock returned to shelf
    expect(after.reservedStock).toBe(0);

    const expiredOrder = await prisma.order.findUnique({
      where: { id: order.body.id },
      include: { reservations: true },
    });
    expect(expiredOrder.status).toBe('EXPIRED');
    expect(expiredOrder.reservations[0].status).toBe('EXPIRED');
  });

  test('does not expire reservations still within their window', async () => {
    const p = await createProduct({ availableStock: 10 });
    await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: p.id, quantity: 2 }] });

    const result = await expireDueReservations();
    expect(result.expiredOrders).toBe(0);

    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after.reservedStock).toBe(2);
  });
});
