const router = require('express').Router();
const c = require('../controllers/reservationController');

router.get('/', c.list);
router.post('/expire', c.expireNow);

module.exports = router;
