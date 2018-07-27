const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const RestaurantController = require('../controllers/RestaurantController');

router.get('/restaurant/list', AuthMiddleware, (req, res, next) => {
	RestaurantController.getList(req, res, next);
});

router.get('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.get(req, res, next);
});

router.get('/restaurant/:restaurantId/tableUsers', AuthMiddleware, (req, res, next) => {
	RestaurantController.getTableUsers(req, res, next);
});

router.put('/restaurant', AuthMiddleware, (req, res, next) => {
	RestaurantController.create(req, res, next)
});

router.patch('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.update(req, res, next)
});


/* TODO */
router.get('/restaurant/stripeAccount', AuthMiddleware, (req, res, next) => {
	// RestaurantController.getStripeAccount(req, res, next);
});

router.patch('/restaurant/stripeAccount', AuthMiddleware, (req, res, next) => {
	// RestaurantController.update(req, res, next)
});

router.put('/restaurant/stripeAccount', AuthMiddleware, (req, res, next) => {
	// RestaurantController.update(req, res, next)
});

module.exports = router;