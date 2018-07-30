/**
 * @apiDefine Item Item
 * All endpoints relating to the Item resource
 */

const router = require('express').Router();
const ItemController = require('../controllers/ItemController');
const AuthMiddleware = require('../middleware/Authentication');

/**
 * @api {post} /item Create
 * @apiGroup Item
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user may add a new item to an existing menu category.
 * @apiParam {String} categoryId The ID of the category to which the item is to be added
 * @apiParam {String} name The item name, e.g. "BBQ Ribs"
 * @apiParam {Float} price The price of the item, to two decimal places
 * @apiParam {String} [description] A string describing the item
 * @apiSuccessExample {json} Success-Response (201):
 * {
 *     "itemId": String 
 * }
 * @apiErrorExample categoryNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "categoryNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.post('/item', AuthMiddleware, (req, res, next) => {
	ItemController.create(req, res, next);
});

/**
 * @api {patch} /item/:itemId Update
 * @apiGroup Item
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription The details of an item may be updated by the user.
 *
 * @apiParam {String} itemId The ID of the item to be updated
 * @apiParam {String} [name] A new name for the item, e.g. "BBQ Pork Ribs"
 * @apiParam {Float} [price] The new price of the item, to two decimal places
 * @apiParam {String} [description] A new description for the item
 * @apiParam {Boolean} [active] This parameter can be used to activate or deactivate an item (only active items will be visible to customers).
 * @apiErrorExample itemNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "itemNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.patch('/item/:itemId', AuthMiddleware, (req, res, next) => {
	ItemController.update(req, res, next);
});

module.exports = router;