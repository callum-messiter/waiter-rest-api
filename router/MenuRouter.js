/**
 * @apiDefine Menu Menu
 * All endpoints relating to the Menu resource
 */

const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const MenuController = require('../controllers/MenuController');

/**
 * @api {get} /menu/:menuId Get
 * @apiGroup Menu
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiPermission diner
 * @apiDescription A user can retrieve a menu, including all its categories and items.
 * @apiParam {String} menuId The ID of the menu to be retrieved
 * @apiSuccessExample {json} Success-Response (200):
 * {  
 *     "id": String,
 *     "name": String,
 *     "restaurant": {  
 *         "id": String,
 *         "name": String
 *     },
 *     "categories": [  
 *         {  
 *             "id": String,
 *             "name": String,
 *             "items": [  
 *                 {  
 *                     "id": String,
 *                     "name": String,
 *                     "price": Float,
 *                     "description": String
 *                 }
 *             ]
 *         }
 *     ]
 * }
 * @apiErrorExample menuNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "menuNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.get('/menu/:menuId', AuthMiddleware, (req, res, next) => {
	MenuController.get(req, res, next);
});

/**
 * @api {post} /menu Create
 * @apiGroup Menu
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user can add a new menu to an existing restaurant.
 * @apiParam {String} restaurantId The ID of the restaurant to which the menu is to be assigned
 * @apiParam {String} name The name of the menu, e.g. "Main Menu"
 * @apiParam {String} [description] A description of the menu, e.g. "Our delicious main courses"
 * @apiSuccessExample {json} Success-Response (201):
 * {
 *     "menuId": String
 * }
 * @apiErrorExample restaurantNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.post('/menu', AuthMiddleware, (req, res, next) => {
	MenuController.create(req, res, next)
});

/**
 * @api {patch} /menu/:menuId Update
 * @apiGroup Menu
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user can add a new menu to an existing restaurant.
 * @apiParam {String} menuId The ID of the menu to be updated
 * @apiParam {String} [name] A new name for the menu, e.g. "Mains"
 * @apiParam {String} [description] A new description of the menu, e.g. "A variety of our delicious main courses"
 * @apiParam {String} [active] This parameter can be used to deactivate the menu (only active menus are visible to customers). 
 * If this parameter is provided, all other optional parameters will be ignored.
 * @apiErrorExample menuNotFound (404):
 * {
 *     "statusCode": 404,
 *     "errorKey": "menuNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.patch('/menu/:menuId', AuthMiddleware, (req, res, next) => {
	MenuController.update(req, res, next)
});

module.exports = router;