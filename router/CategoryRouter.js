/**
 * @apiDefine Category Category
 * All endpoints relating to the Category resource
 */

const router = require('express').Router();
const CategoryController = require('../controllers/CategoryController');
const AuthMiddleware = require('../middleware/Authentication');

/**
 * @api {post} /category Create
 * @apiGroup Category
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiDescription A user may add a new category to an existing menu.
 * @apiParam {String} menuId The ID of the menu to which the category is to be added
 * @apiParam {String} name The category name, e.g. "Desserts"
 * @apiParam {String} [description] A string describing the category
 * @apiSuccessExample {json} Success-Response (201):
 *{
 *    "categoryId": String 
 *}
 * @apiErrorExample menuNotFound (404):
 *{
 *   "statusCode": 404,
 *   "errorKey": "menuNotFound",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.post('/category', AuthMiddleware, (req, res, next) => {
	CategoryController.create(req, res, next);
});

/**
 * @api {patch} /category/:categoryId Update
 * @apiGroup Category
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiDescription The details of a category may be updated by the user.
 *
 * @apiParam {String} categoryId The ID of the category to be updated
 * @apiParam {String} [name] A new name for the category, e.g. "Puddings"
 * @apiParam {String} [description] A new description for the category
 * @apiParam {Boolean} [active] This parameter can be used to activate or deactivate a category (only active categories will be visible to customers).
 * @apiErrorExample categoryNotFound (404):
 *{
 *   "statusCode": 404,
 *   "errorKey": "categoryNotFound",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.patch('/category/:categoryId', AuthMiddleware, (req, res, next) => {
	CategoryController.update(req, res, next);
});

module.exports = router;