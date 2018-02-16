// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');
// Models
const Auth = require('../models/Auth');
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');
const Restaurants = require('../models/Restaurants');
const Menus = require('../models/Menus');
// Config
const secret = require('../config/jwt').secret;
const ResponseHelper = require('../helpers/ResponseHelper');

/**
	Login for restaurateur accounts
**/
router.get('/login', (req, res, next) => {
	if(!req.query.email || !req.query.password) {
		ResponseHelper.missingRequiredData(res, ['email', 'password']);
	} else {

		Users.getUserByEmail(req.query.email)
		.then((result) => {

			if(result.length < 1) return res.status(404).json({errorKey: 'email_not_registered'});
			if(result[0].isActive !== 1) return res.status(403).json({errorKey: 'user_not_active'});
			// Add the user to the response-local var, accessible throughout the chain
			res.locals = { user: JSON.parse(JSON.stringify(result[0])) };
			return Users.checkPassword(req.query.password, result[0].password);

		}).then((passIsValid) => {

			if(passIsValid !== true) return res.status(404).json({errorKey: 'password_invalid'});
			const u = res.locals.user;
			return Auth.createUserToken(u.userId, u.roleId);

		}).then((token) => {

			res.locals.user.token = token;
			const u = res.locals.user;
			return Restaurants.getRestaurantByOwnerId(u.userId);

		}).then((restaurant) => {

			if(restaurant.length < 1) return res.status(404).json({errorKey: 'restaurant_not_found'});
			res.locals.restaurant = JSON.parse(JSON.stringify(restaurant[0]));
			return Menus.getMenuByRestaurantId(restaurant[0].restaurantId);

		}).then((menu) => {

			if(menu.length < 1) return res.status(404).json({errorKey: 'menu_not_found'});
			const u = res.locals.user;
			const r = res.locals.restaurant;
			res.status(200).json({
				user: {
					userId: u.userId,
					role: u.roleId,
					token: u.token
				},
				// For now we will return the first restaurant, since each user will only have one
				restaurant: {
					restaurantId: r.restaurantId,
					name: r.name
				},
				// For now we will return the first menu, since each restaurant will only have one
				menu: {
					menuId: menu[0].menuId,
					name: menu[0].name
				}
			});

		}).catch((err) => {
			res.status(500).json(err);
		});
	}
});

/**
 * @api {get} /auth/logout Logout
 * @apiGroup Auth
 * @apiDescription If the API returns a 200 OK response, the client application should destroy the user's token
 * @apiPermission diner, restaurateur, internalAdmin, externalAdmin
 * @apiHeader {String} Authorization The user access token provided by the API upon successful login
 * @apiParam {String} userId The id of the user, which should be provided to the client app by the api upon login, and stored locally
 * @apiSuccessExample {json} Success 200
{
    "success": true,
    "error": "",
    "data": {}
}
 * @apiErrorExample {json} 401 Invalid token
{
    "success": false,
    "error": "invalid_token",
    "msg": "The server determined that the token provided in the request is invalid. It likely expired - try logging in again."
}
 * @apiErrorExample {json} 404 Mandatory request data missing
{
    "success": false,
    "error": "missing_required_data",
    "msg": "The server was expecting a userId and a token. At least one of these parameters was missing from the request."
}
 * @apiErrorExample {json} 404 Error deleting token reference from db
{
    "success": false,
    "error": "error_deleting_token_ref",
    "msg": "The server executed the query successfully, but nothing was deleted. It's likely that userId-token combination provided does not exist in the database."
}
 * @apiErrorExample {json} 500 deleteTokenReferenence (SQL) error
{
    "success": false,
    "error": "deleting_token_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
**/
router.get('/logout', (req, res, next) => {
	if(!req.headers.authorization || !req.query.userId) {
		ResponseHelper.invalidRequest(res, ['userId']);
	} else {
		Auth.verifyToken(req.headers.authorization)
		.then((result) => {
			// TODO: do we need to check the result value?
			res.send(result);
		}).catch((err) => {
			// TODO: think about how to handle errors with optimal transparency for the client-side dev
			res.status(500).json(err);
		});
	}
});

module.exports = router;