const router = require('express').Router();
const ItemController = require('../controllers/ItemController');
const AuthMiddleware = require('../middleware/Authentication');

router.put('/item', AuthMiddleware, (req, res, next) => {
	ItemController.create(req, res, next);
});

router.patch('/item/:itemId', AuthMiddleware, (req, res, next) => {
	ItemController.update(req, res, next);
});

module.exports = router;