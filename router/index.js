/* 
	*GET*: retrieves a resources at the specified URL, e.g. /resources/{resourceId}
	*POST*: creates a new resource under the /resources URL, or collection. Usually the resource identifier is returned by the server
	*PUT*: creates a new resource under the /resources/{resourceId} URL, where the resource ID is specified in the request URL. If the resources already exists, it will
	be replaced in its entirety (PUT is idempotent)
	*PATCH*: performs a partial update of a resource at the provided URL 
*/

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

/* Direct root requests to documentation */
router.use('/', (req, res, next) => res.redirect('/apidoc') );

module.exports = router;