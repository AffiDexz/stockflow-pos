require('dotenv').config();
const app = require('./app');
const { startExpiryJob } = require('./jobs/expiryJob');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ShopFlow API running on http://localhost:${PORT}`);
  startExpiryJob();
});
