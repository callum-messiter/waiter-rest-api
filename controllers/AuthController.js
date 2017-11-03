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
 * @api {get} /auth/login Login
 * @apiGroup Auth
 * @apiPermission diner, restaurateur, internalAdmin, externalAdmin
 * @apiParam {String} email The user's email address
 * @apiParam {String} password The user's password
 * @apiSuccessExample {json} Success 200
{
    "success": true,
    "error": "",
    "data": {
        "userId": 1,
        "role": 200,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGdvcml0aG0iOiJIUzI1NiIsImlzc3VlciI6Imh0dHA6Ly9hcGkud2FpdGVyLmNvbSIsImlhdCI6MTUwNzk5MzM4MzkyNSwiZXhwIjoxNTA4NTk4MTgzOTI1LCJ1c2VySWQiOjEsInVzZXJSb2xlIjoyMDB9.qD1TEz1I0hn1jBtekPEpNJjoLCmMxSiB-Ik4DzRI2E0"
    }
}
 * @apiErrorExample {json} 401 Invalid login credentials
{
    "success": false,
    "error": "invalid_login_credentials",
    "msg": "The email-password combination does not exist in the database."
}
 * @apiErrorExample {json} 403 The user account is not active
{
    "success": false,
    "error": "user_not_active",
    "msg": "This user account is inactive. The account was either suspended by waiter, or deactivated by the user."
}
 * @apiErrorExample {json} 403 The user account is not verified
{
    "success": false,
    "error": "user_not_verified",
    "msg": "This user account is not verified. The user should have a verification email in the inbox of their registered email account. If not, request another one."
}
 * @apiErrorExample {json} 404 Missing query-string parameters
{
    "success": false,
    "error": "missing_required_params",
    "msg": "The request must contain an email address and password."
}
 * @apiErrorExample {json} 500 doesUserExist (SQL) error
{
    "success": false,
    "error": "get_user_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
 * @apiErrorExample {json} 500 checkPassword (bcrypt) error
{
    "success": false,
    "error": "bcrypt_error",
    "msg": // bycrpt error key/message
}
 * @apiErrorExample {json} 500 getUserRole (SQL) error
{
    "success": false,
    "error": "get_user_role_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
 * @apiErrorExample {json} 500 createUserToken (jwt) error
{
    "success": false,
    "error": 'jwt_error',
    "msg": // jwt error message - report to the api dev
}
 * @apiErrorExample {json} 500 createUserToken (jwt) error
{
    "success": false,
    "error": 'jwt_token_null',
    "msg": "The server could not create a unique token."
}
 * @apiErrorExample {json} 500 saveUserTokenReference (SQL) error
{
    "success": false,
    "error": 'token_not_added_to_db',
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
 */
router.get('/login', (req, res, next) => {
	// CHeck that the email and password were set
	if(!req.query.email || !req.query.password) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The request must contain an email address and password.');
	} else {
		const email = req.query.email;
		const password = req.query.password;
		// Check that the email address entered is registered
		Users.doesUserExist(email, (err, user) => {
			if(err) {
				ResponseHelper.sendError(res, 500, 'get_user_query_error', err.code);
			} else if(user.length < 1) {
				ResponseHelper.sendError(res, 401, 'invalid_login_credentials', 
					'The email-password combination does not exist in the database.');
			} else {
				// Check if the user is active
				if(user[0].isActive !== 1) {
					ResponseHelper.sendError(res, 403, 'user_not_active', 
						'This user account is inactive. The account was either suspended by waiter, or deactivated by the user.');
				} else {
					// Ignore user verification for now
					if(1 == 2 /**user[0].isVerified !== 1**/) {
						ResponseHelper.sendError(res, 403, 'user_not_verified', 
							'This user account is not verified. The user should have a verification email in the inbox of their registered email account. If not, request another one.');
					} else  {
						// Check that the user entered the correct password
						const plainTextPassword = password;
						const hashedPassword = user[0].password
						Users.checkPassword(plainTextPassword, hashedPassword, (err, passwordsMatch) => {
							if(err) {
								ResponseHelper.sendError(res, 500, 'bcrypt_error', err);
							} else if(!passwordsMatch) {
								ResponseHelper.sendError(res, 401, 'invalid_login_credentials', 
									'The email-password combination does not exist in the database.');
							} else if(passwordsMatch){
								// Get the user's role to store in the token
								UserRoles.getUserRole(user[0].userId, (err, userRole) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'get_user_role_query_error', err.code);
									} else {
										const role = userRole[0].roleId;
										// Generate token
										Auth.createUserToken(user[0].userId, role, (err, token) => {
											if(err) {
												ResponseHelper.sendError(res, 500, 'jwt_error', err);
											} else if(token == null) {
												ResponseHelper.sendError(res, 500, 'jwt_token_null', 
													'The server could not create a unique token.');
											} else {
												// Decode token and get userId and exp
												const decodedToken = jwt.decode(token);
												const tokenUserId = decodedToken.userId;
												// Get expirary date of token
												const tokenExp = decodedToken.exp;
												const expiresAt = moment(tokenExp).format('YYYY-MM-DD HH:mm:ss');
												// Get current datetime
												const currentDate = new Date();
												const now = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');
												// Add the token to the db for reference
												const userToken = {
													userId: tokenUserId,
													token: token,
													date: now,
													expiryDate: expiresAt
												}
												// Add token to the db for reference
												Auth.saveUserTokenReference(userToken, (err, result) => {
													if(err) {
														ResponseHelper.sendError(res, 500, 'token_not_added_to_db', err);
													} else {
														// Get the user's restaurant
														Restaurants.getRestaurantById(user[0].userId, (err, restaurant) => {
															// Return the relevant user details to the client
															if(err) {
																ResponseHelper.sendError(res, 500, 'get_restaurant_query_error', err);
															} else if(restaurant.length < 1) {
																ResponseHelper.sendError(res, 404, 'restaurant_not_found', 
																	'The query returned zero results. This user does not have an associated restaurant.');
															} else {
																Menus.getMenuByRestaurantId(restaurant[0].restaurantId, (err, menu) => {
																	if(err) {
																		ResponseHelper.sendError(res, 500, 'get_menu_query_error', err);
																	} else if(restaurant.length < 1) {
																		ResponseHelper.sendError(res, 404, 'menu_not_found', 
																			'The query returned zero results. This user\'s restaurant does not have an associated menu.');
																	} else {
																		ResponseHelper.sendSuccess(res, 200, {
																			user: {
																				userId: user[0].userId,
																				role: role,
																				token: token
																			},
																			// For now we will return the first restaurant, since the user will only have one
																			restaurant: {
																				restaurantId: restaurant[0].restaurantId,
																				name: restaurant[0].name
																			},
																			// For now we will return the first menu, since the user will only have one
																			menu: {
																				menuId: menu[0].menuId,
																				name: menu[0].name
																			}
																		});
																	}
																});
															}
														});
													}
												});
											}
										});
									}
								});
							}
						});
					}
				}
			}
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
	if(!req.query.userId || !req.headers.authorization) {
		ResponseHelper.sendError(res, 404, 'missing_required_data', 
			'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const token = req.headers.authorization;
		const userId = req.query.userId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Delete the token from the DB (the token will be invalidated/deleted by the client)
				Auth.deleteTokenReference(token, userId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'deleting_token_query_error', err);
					} else {
						if(result.affectedRows < 1) {
							ResponseHelper.sendError(res, 404, 'error_deleting_token_ref', 
								'The server executed the query successfully, but nothing was deleted. It\'s likely that userId-token combination provided does not exist in the database.');
						} else {
							ResponseHelper.sendSuccess(res, 200);
						}
					}
				});
			}
		});
	}
});

module.exports = router;