/**
 * @apiDefine User User
 * All endpoints relating to the User resource
 */

const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const UserController = require('../controllers/UserController');

/**
 * @api {post} /user Create
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiDescription Handles the creation of a new user account.
 * @apiParam {String} type The type of user account to be created. Can be either "diner" or "restaurateur"
 * @apiParam {String} firstName The user's first name
 * @apiParam {String} lastName The user's surname (family name)
 * @apiParam {String} email A valid email address to be assigned to the user's Waitr account
 * @apiParam {String} password A string containing a minimum of eight characters, at least one letter, and at least one number.
 * @apiParam {String} [restaurantName] If the `type` parameter is "restaurateur", this parameter must be provided. Otherwise it will be ignored.
 * @apiSuccessExample {json} Success-Response (201):
 *{
 *    "user": {
 *        "id": String,
 *        "firstName": String,
 *        "lastName": String,
 *        "email": String,
 *        "role": Int
 *    },
 *    "restaurant": {
 *        "id": String,
 *        "ownerId": String,
 *        "name": String
 *    },
 *    "menu": {
 *        "id": String,
 *        "restaurantId": String,
 *        "name": String
 *    }
 *}
 * @apiErrorExample invalidUserType (401):
 *{
 *   "statusCode": 401,
 *   "errorKey": "invalidUserType",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 * @apiErrorExample emailInvalid (400):
 *{
 *   "statusCode": 400,
 *   "errorKey": "emailInvalid",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
  * @apiErrorExample emailAlreadyRegistered (401):
 *{
 *   "statusCode": 401,
 *   "errorKey": "emailAlreadyRegistered",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 * @apiErrorExample passwordInvalid (400):
 *{
 *   "statusCode": 400,
 *   "errorKey": "passwordInvalid",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.post('/user', AuthMiddleware, (req, res, next) => {
	UserController.create(req, res, next);
});

/**
 * @api {patch} /user/:userId Update
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiDescription Handles the modification of the details of an existing user account.
 *
 * @apiParam {String} userId The ID of the user to be updated
 * @apiParam {String} [firstName] The user's new first name
 * @apiParam {String} [lastName] The user's new surname (family name)
 * @apiParam {String} [email] A new valid email address to be assigned to the user's Waitr account.
 * (If this parameter is provided, all other optional parameters will be ignored.)
 * @apiParam {String} [password] A string containing a minimum of eight characters, at least one letter, and at least one number.
 * (If this parameter is provided, all other optional parameters will be ignored.)
 * @apiParam {Boolean} [active] A string containing a minimum of eight characters, at least one letter, and at least one number.
 * @apiErrorExample userNotFound (404):
 *{
 *   "statusCode": 404,
 *   "errorKey": "userNotFound",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.patch('/user/:userId', AuthMiddleware, (req, res, next) => {
	UserController.update(req, res, next);
});

module.exports = router;