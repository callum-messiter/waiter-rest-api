const express = require('express');
const router = express.Router();

// Import any api-specific controllers here
const UserController = require('../controllers/UserController');
const RestaurateurController = require('../controllers/RestaurateurController');
const DinerController = require('../controllers/DinerController');
const AdminController = require('../controllers/AdminController');
const AuthController = require('../controllers/AuthController');
const RestaurantController = require('../controllers/RestaurantController');
const MenuController = require('../controllers/MenuController');
const SectionController = require('../controllers/SectionController');
const CategoryController = require('../controllers/CategoryController');
const ItemController = require('../controllers/ItemController');
const TransactionController = require('../controllers/TransactionController');
const EmailController = require('../controllers/EmailController');
const OrderController = require('../controllers/OrderController');

// Append controller routes to the '/api' endpoint here
router.use('/user', UserController);
router.use('/restaurateur', RestaurateurController);
router.use('/diner', DinerController);
router.use('/admin', AdminController);
router.use('/auth', AuthController);
router.use('/restaurant', RestaurantController);
router.use('/menu', MenuController);
router.use('/section', SectionController);
router.use('/category', CategoryController);
router.use('/item', ItemController);
router.use('/transaction', TransactionController);
router.use('/email', EmailController);
router.use('/order', OrderController);

module.exports = router;
