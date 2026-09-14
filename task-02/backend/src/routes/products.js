const router = require('express').Router();
const c = require('../controllers/productController');
router.get('/', c.list);
router.get('/:id', c.getOne);
module.exports = router;
