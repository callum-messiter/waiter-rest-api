const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const MenuController = require('../controllers/MenuController');

router.get('/menu/:menuId', AuthMiddleware, (req, res, next) => {
	MenuController.get(req, res, next);
});

router.put('/menu', AuthMiddleware, (req, res, next) => {
	MenuController.create(req, res, next)
});

router.patch('/menu/:menuId', AuthMiddleware, (req, res, next) => {
	MenuController.update(req, res, next)
});

module.exports = router;