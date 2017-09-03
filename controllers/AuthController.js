// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');
// Config
const secret = require('../config/jwt').jwt.secret;
const JsonResponse = require('../helpers/JsonResponse');
// Models
const Auth = require('../models/Auth');
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');

router.get('/', (req, res, next) => {
});

/**

	User login

**/
router.get('/login', (req, res, next) => {
	// CHeck that the email and password were set
	if(req.query.email && req.query.password) {
		const email = req.query.email;
		const password = req.query.password;
		// Check that the email address entered is registered
		Users.doesUserExist(email, (err, user) => {
			if(err) {
				JsonResponse.sendError(res, 500, 'get_user_query_error', err);
			} else if(user.length < 1) {
				JsonResponse.sendError(res, 404, 'unregistered_email_address', 'The email address supplied is not registered.');
			} else {
				// Check if the user is active
				if(user[0].IsActive) {
					// Check if the user is verified
					if(user[0].IsVerified) {
						// Check that the user entered the correct password
						const plainTextPassword = password;
						const hashedPassword = user[0].Password
						Users.checkPassword(plainTextPassword, hashedPassword, (err, passwordsMatch) => {
							if(err) {
								JsonResponse.sendError(res, 500, 'bcrypt_error', err);
							} else if(!passwordsMatch) {
								JsonResponse.sendError(res, 401, 'invalid_password', 'The email account is registered but the password provided is invalid.');
							} else if(passwordsMatch){
								// Get the user's role to store in the token
								UserRoles.getUserRole(user[0].UserId, (err, userRole) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'get_user_role_query_error', err);
									} else {
										const role = userRole[0].RoleId;
										// Generate token
										Auth.createUserToken(user[0].UserId, role, (err, token) => {
											if(err) {
												JsonResponse.sendError(res, 500, 'jwt_error', err);
											} else if(token == null) {
												JsonResponse.sendError(res, 500, 'jwt_token_null', 'The server could not create a unique token.');
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
													UserId: tokenUserId,
													Token: token,
													Date: now,
													ExpiryDate: expiresAt
												}
												// Add token to the db for reference
												Auth.saveUserTokenReference(userToken, (err, result) => {
													if(err) {
														JsonResponse.sendError(res, 500, 'token_not_added_to_db', err);
													} else {
														// Return the relevant user details to the client
														JsonResponse.sendSuccess(res, 200, {
															userId: user[0].UserId,
															role: role,
															token: token
														});
													}
												});
											}
										});
									}
								});
							}
						});
					} else {
						JsonResponse.sendError(res, 401, 'user_not_verified', 'This user account is not verified.');
					}
				} else {
					JsonResponse.sendError(res, 401, 'user_not_active', 'This user account is inactive. The account was either suspended by waiter, or deactivated by the user.');
				}
			}
		});
	} else {
		JsonResponse.sendError(res, 404, 'missing_required_params', 'The request must contain an email address and password.');
	}
});

/**

	User logout

**/
router.get('/logout', (req, res, next) => {
	if(!req.query.userId || !req.headers.authorization) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const token = req.headers.authorization;
		const userId = req.query.userId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				JsonResponse.sendError(res, 401, 'invalid_token', 'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Delete the token from the DB (the token will be invalidated/deleted by the client)
				Auth.deleteTokenReference(token, userId, (err, result) => {
					if(err) {
						JsonResponse.sendError(res, 500, 'deleting_token_query_error', err);
					} else {
						if(result.affectedRows < 1) {
							JsonResponse.sendError(res, 404, 'error_deleting_token_ref', 'The server executed the query successfully, but nothing was deleted. It\'s likely that there exists no combination of the supplied userId and token.');
						} else {
							JsonResponse.sendSuccess(res, 200);
						}
					}
				});
			}
		});
	}
});

module.exports = router;