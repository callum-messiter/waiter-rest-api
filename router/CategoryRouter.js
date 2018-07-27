const router = require('express').Router();
const CategoryController = require('../controllers/CategoryController');
const AuthMiddleware = require('../middleware/Authentication');

router.put('/category', AuthMiddleware, (req, res, next) => {
	CategoryController.create(req, res, next);
});

router.patch('/category/:categoryId', AuthMiddleware, (req, res, next) => {
	CategoryController.update(req, res, next);
});

module.exports = router;