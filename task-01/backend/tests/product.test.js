const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Product CRUD', () => {
  test('creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Keyboard', price: 9800, availableStock: 5 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Keyboard');
    expect(res.body.availableStock).toBe(5);
  });

  test('rejects invalid product', async () => {
    const res = await request(app).post('/api/products').send({ price: -1 });
    expect(res.status).toBe(400);
  });

  test('lists and gets a product (current stock)', async () => {
    const created = await prisma.product.create({
      data: { name: 'Mouse', price: '2200.00', availableStock: 7 },
    });
    const list = await request(app).get('/api/products');
    expect(list.body).toHaveLength(1);

    const one = await request(app).get(`/api/products/${created.id}`);
    expect(one.status).toBe(200);
    expect(one.body.availableStock).toBe(7);
  });

  test('updates a product', async () => {
    const p = await prisma.product.create({
      data: { name: 'Old', price: '10.00', availableStock: 1 },
    });
    const res = await request(app)
      .put(`/api/products/${p.id}`)
      .send({ name: 'New', availableStock: 20 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New');
    expect(res.body.availableStock).toBe(20);
  });

  test('deletes a product', async () => {
    const p = await prisma.product.create({
      data: { name: 'Temp', price: '10.00', availableStock: 1 },
    });
    const res = await request(app).delete(`/api/products/${p.id}`);
    expect(res.status).toBe(204);
    const gone = await request(app).get(`/api/products/${p.id}`);
    expect(gone.status).toBe(404);
  });
});
