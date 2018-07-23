const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/Authentication');
const AuthController = require('../controllers/AuthController');

router.get('/auth/login', (req, res, next) => {
	AuthController.login(req, res, next);
});

router.get('/auth/dinerLogin', (req, res, next) => {
	AuthController.dinerLogin(req, res, next)
});

router.get('/auth/logout', AuthMiddleware, (req, res, next) => {
	AuthController.logout(req, res, next)
});

module.exports = router;