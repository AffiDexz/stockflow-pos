const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ShopFlow API' }));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
