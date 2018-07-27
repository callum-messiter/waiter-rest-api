const router = require('express').Router();
const AuthRouter = require('./AuthRouter');
const UserRouter = require('./UserRouter');
const RestaurantRouter = require('./RestaurantRouter');
const MenuRouter = require('./MenuRouter');
const CategoryRouter = require('./CategoryRouter');
const ItemRouter = require('./ItemRouter');
const OrderRouter = require('./OrderRouter');

router.use(AuthRouter);
router.use(UserRouter);
router.use(RestaurantRouter);
router.use(MenuRouter);
router.use(CategoryRouter);
router.use(ItemRouter);
router.use(OrderRouter);

module.exports = router;