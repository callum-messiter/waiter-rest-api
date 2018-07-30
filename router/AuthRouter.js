/**
 * @apiDefine Auth Auth
 * Used by clients to retrieve an access token for users, which will be provided in all requests thereafter
 */

const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const AuthController = require('../controllers/AuthController');
const e = require('../helpers/ErrorHelper').errors;

/**
 * @api {get} /auth/login Login
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiDescription If valid login credentials are provided, a user object, containing an authentication token, will be returned. If 
 * the user has the restaurateur roleID, the response body will also contain restaurant and menu objects.
 *
 * @apiParam {String} email The email address which is associated to the user's Waitr account
 * @apiParam {String} password The user's password
 * @apiSuccessExample {json} Success-Response (200): 
 * {  
 *     "user": {  
 *         "userId": String,
 *         "firstName": String,
 *         "lastName": String,
 *         "email": String,
 *         "role": Int,
 *         "token": String
 *     },
 *     "restaurant": {  
 *         "restaurantId": String,
 *         "name": String,
 *         "isStripeAccountVerified": Bool
 *     },
 *     "menu": {  
 *         "menuId": String,
 *         "name": String
 *     }
 * }
 * @apiErrorExample emailNotRegistered (401): 
 * {  
 *     "statusCode": 401,
 *     "errorKey": "emailNotRegistered",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample passwordIncorrect (401): 
 * {
 *     "statusCode":  401,
 *     "errorKey":  "passwordIncorrect",
 *     "type":  String,
 *     "devMsg":  String,
 *     "userMsg":  String
 * }
 * @apiErrorExample restaurantNotFound (404): 
 * {
 *     "statusCode":  404,
 *     "errorKey":  "restaurantNotFound",
 *     "type":  String,
 *     "devMsg":  String,
 *     "userMsg":  String
 * }
 * @apiErrorExample menuNotFound (404): 
 * {
 *     "statusCode":  404,
 *     "errorKey":  "menuNotFound",
 *     "type":  String,
 *     "devMsg":  String,
 *     "userMsg":  String
 * }
 */
router.get('/auth/login', (req, res, next) => {
	AuthController.login(req, res, next);
});

/* Not yet in use */
router.get('/auth/logout', AuthMiddleware, (req, res, next) => {
	AuthController.logout(req, res, next)
});

module.exports = router;