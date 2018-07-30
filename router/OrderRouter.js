/**
 * @apiDefine Order Order
 * All endpoints relating to the Order resource
 */

const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const OrderController = require('../controllers/OrderController');

/**
 * @api {get} /order List
 * @apiGroup Order
 * @apiVersion 1.0.0
 * @apiName List
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiPermission diner
 * @apiDescription A user can retrieve a list of orders; either all orders placed by a particular diner, or all those placed at a particular restaurant.
 * @apiParam {String} ownerId The ID of the owner of the orders. For a diner's orders, provide a valid userId. For a restaurant's orders, provide a valid restaurantId.
 * @apiParam {String} [liveOnly] Setting this parameter to true will cause the server to filter out any resolved orders (e.g. accepted orders, rejected orders etc.). 
 * Defaults to `false`.
 * @apiSuccessExample {json} Success-Response (200):
 * [  
 *     {  
 *         "id": String,
 *         "price": Float,
 *         "status": Int,
 *         "timePlaced": Int,
 *         "customer": {  
 *             "id": String,
 *             "firstName": String,
 *             "lastName": String
 *         },
 *         "restaurant": {  
 *             "id": String,
 *             "name": String,
 *             "tableNo": String
 *         },
 *         "items": [  
 *             {  
 *                 "id": String,
 *                 "name": String,
 *                 "price": Float
 *             }
 *         ]
 *     }
 * ]
 * @apiErrorExample restaurantNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample userNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "userNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.get('/order/list', AuthMiddleware, (req, res, next) => {
	OrderController.getList(req, res, next)
});

/**
 * @api {get} /order/:orderId Get
 * @apiGroup Order
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiPermission diner
 * @apiDescription A user can retrieve a specific order. Useful when a customer wishes to see a breakdown of an order they've placed.
 * @apiParam {String} orderId The ID of the order to be retrieved
 * @apiSuccessExample {json} Success-Response (200):
 * {  
 *     "id": String,
 *     "price": Float,
 *     "status": Int,
 *     "timePlaced": Int,
 *     "customer": {  
 *         "id": String,
 *         "firstName": String,
 *         "lastName": String
 *     },
 *     "restaurant": {  
 *         "id": String,
 *         "name": String,
 *         "tableNo": String
 *     },
 *     "items": [  
 *         {  
 *             "id": String,
 *             "name": String,
 *             "price": Float
 *         }
 *     ]
 * }
 * @apiErrorExample orderNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "orderNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.get('/order/:orderId', AuthMiddleware, (req, res, next) => {
	OrderController.get(req, res, next);
});

/**
 * @api {patch} /order/:orderId Refund
 * @apiGroup Order
 * @apiVersion 1.0.0
 * @apiName Refund
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A restaurant can refund an existing paid-for order. The server calls the Stripe API to reverse the charge.
 * @apiParam {String} orderId The ID of the order to be refunded
 * @apiErrorExample orderNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "orderNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample chargeNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "chargeNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample cannotRefundUnpaidOrder (401):
 * {
 *     "statusCode": 401,
 *     "errorKey": "cannotRefundUnpaidOrder",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample stripeError (4XX, 5XX):
 * {
 *     "statusCode": Int,
 *     "errorKey": "stripeError",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.patch('/order/:orderId/refund', AuthMiddleware, (req, res, next) => {
	OrderController.refund(req, res, next);
});

module.exports = router;