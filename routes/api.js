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
const EmailTemplatesController = require('../controllers/EmailTemplatesController');

// Append controller routes to the '/api' endpoint here
router.use('/users', UserController);
router.use('/restaurateurs', RestaurateurController);
router.use('/diners', DinerController);
router.use('/admins', AdminController);
router.use('/auth', AuthController);
router.use('/restaurants', RestaurantController);
router.use('/menus', MenuController);
router.use('/sections', SectionController);
router.use('/categories', CategoryController);
router.use('/items', ItemController);
router.use('/transactions', TransactionController);
router.use('/emailTemplates', EmailTemplatesController);

module.exports = router;
