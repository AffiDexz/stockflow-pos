const router = require('express').Router();
const c = require('../controllers/cartController');

router.post('/', c.createCart);
router.get('/:id', c.getCart);
router.post('/:id/items', c.addItem);
router.put('/:id/items/:itemId', c.updateItem);
router.delete('/:id/items/:itemId', c.removeItem);

module.exports = router;
