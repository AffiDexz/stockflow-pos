// Load the test database URL before any module (and the Prisma client) loads.
require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
