const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, createCategory, createProduct } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Product discovery', () => {
  test('lists products', async () => {
    await createProduct({ name: 'Alpha' });
    await createProduct({ name: 'Beta' });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('search by name', async () => {
    await createProduct({ name: 'Wireless Headphones' });
    await createProduct({ name: 'Backpack' });
    const res = await request(app).get('/api/products?search=head');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Wireless Headphones');
  });

  test('filter by category', async () => {
    const audio = await createCategory('Audio');
    const bags = await createCategory('Bags');
    await createProduct({ name: 'Speaker', categoryId: audio.id });
    await createProduct({ name: 'Bag', categoryId: bags.id });
    const res = await request(app).get(`/api/products?categoryId=${audio.id}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Speaker');
  });

  test('filter by price range', async () => {
    await createProduct({ name: 'Cheap', price: '100.00' });
    await createProduct({ name: 'Mid', price: '500.00' });
    await createProduct({ name: 'Pricey', price: '2000.00' });
    const res = await request(app).get('/api/products?minPrice=200&maxPrice=1000');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Mid');
  });

  test('filter by availability', async () => {
    await createProduct({ name: 'InStock', availableStock: 5 });
    await createProduct({ name: 'Sold', availableStock: 0 });
    const inStock = await request(app).get('/api/products?availability=in_stock');
    expect(inStock.body.every((p) => p.availableStock > 0)).toBe(true);
    const out = await request(app).get('/api/products?availability=out_of_stock');
    expect(out.body).toHaveLength(1);
    expect(out.body[0].name).toBe('Sold');
  });

  test('product details incl. category, 404 for missing', async () => {
    const p = await createProduct({ name: 'Detail' });
    const ok = await request(app).get(`/api/products/${p.id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.category).toBeTruthy();
    const missing = await request(app).get('/api/products/999999');
    expect(missing.status).toBe(404);
  });
});
