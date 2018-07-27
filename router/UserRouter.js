const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const UserController = require('../controllers/UserController');

router.put('/user', AuthMiddleware, (req, res, next) => {
	UserController.create(req, res, next);
});

router.patch('/user/:userId', AuthMiddleware, (req, res, next) => {
	UserController.update(req, res, next);
});

module.exports = router;