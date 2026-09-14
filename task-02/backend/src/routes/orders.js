const router = require('express').Router();
const orders = require('../controllers/orderController');
const payment = require('../controllers/paymentController');

router.post('/', orders.create);
router.get('/', orders.list);
router.get('/:id', orders.getOne);
router.post('/:id/cancel', orders.cancel);
router.post('/:id/payment', payment.pay);

module.exports = router;
