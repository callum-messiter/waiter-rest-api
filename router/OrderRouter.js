const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const OrderController = require('../controllers/OrderController');

router.get('/order/list', AuthMiddleware, (req, res, next) => {
	OrderController.getList(req, res, next)
});

router.get('/order/:orderId', AuthMiddleware, (req, res, next) => {
	OrderController.get(req, res, next);
});

router.patch('/order/refund', AuthMiddleware, (req, res, next) => {
	OrderController.refund(req, res, next);
});

module.exports = router;