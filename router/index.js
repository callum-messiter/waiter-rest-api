const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/Authentication');

const AuthController = require('../controllers/AuthController');

router.get('/auth/login', (req, res, next) => {
	AuthController.login(req, res, next);
});

router.get('/auth/login/d', (req, res, next) => {
	AuthController.dinerLogin(req, res, next)
});

router.get('/auth/logout', authenticate, (req, res, next) => {
	AuthController.logout(req, res, next)
});

const CategoryController = require('../controllers/CategoryController');

router.put('/auth/logout', authenticate, (req, res, next) => {
	CategoryController.create(req, res, next);
});

router.patch('/category/update/:categoryId', authenticate, (req, res, next) => {
	CategoryController.update(req, res, next)
});

module.exports = router;
