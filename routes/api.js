const express = require('express');
const router = express.Router();
const mw = require('./middleware');

/**
	 Import any api-specific controllers here. 
**/
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const RestaurantController = require('../controllers/RestaurantController');
const MenuController = require('../controllers/MenuController');
const CategoryController = require('../controllers/CategoryController');
const ItemController = require('../controllers/ItemController');
const OrderController = require('../controllers/OrderController');
const EmailController = require('../controllers/EmailController');

// Append controller routes to the '/api' endpoint here
router.use('/user', UserController);
router.use('/auth', mw.authoriseUser, AuthController);
router.use('/restaurant', RestaurantController);
router.use('/menu', MenuController);
router.use('/category', CategoryController);
router.use('/item', ItemController);
router.use('/order', OrderController);
router.use('/email', EmailController);

module.exports = router;
