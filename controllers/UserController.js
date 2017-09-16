// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
// Models
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');
const Auth = require('../models/Auth');
const Restaurants = require('../models/Restaurants');
const JsonResponse = require('../helpers/JsonResponse');

/**
	Get a list of all registered users
**/
router.get('/', (req, res, next) => {
	// Check that the user is a waiterAdmin
	Users.getAllUsers((err, users) => {
		if(err) {
			JsonResponse.sendError(res, 500, 'get_all_users_query_error', err);
		} else {
			JsonResponse.sendSuccess(res, 200, {users: users});
		}
	})
});

/**
	Get single user by ID
**/
router.get('/:userId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.userId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const userId = req.params.userId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				JsonResponse.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				const requesterRole = decodedpayload.userRole;
				const requesterId = decodedpayload.userId;
				const waiterAdmin = UserRoles.roleIDs.waiterAdmin;
				// User details can be accessed only by the owner, or by an internal admin
				if(requesterId != userId && requesterRole != waiterAdmin) {
					JsonResponse.sendError(res, 401, 'unauthorised', 
						'A user\'s details can be accessed only by the owner, or by admins.');
				} else {
					Users.getUserById(req.params.userId, (err, user) => {
						if(err) {
							JsonResponse.sendError(res, 500, 'get_user_query_error', err);
						} else {
							if(user.length < 1) {
								JsonResponse.sendError(res, 404, 'user_not_found', 
									'There are no users matching the ID provided.');
							} else {
								// Return only insensitive user information
								user = {
									userId: user[0].UserId,
									email: user[0].Email, 
									firstName: user[0].FirstName,
									lastName: user[0].LastName,
									isVerified: user[0].IsVerified,
									isActive: user[0].IsActive
								}
								JsonResponse.sendSuccess(res, 200, user);
							}
						}
					});
				}
			}
		});
	}
});

/**
	Create user 
**/
router.post('/create/:userType', (req, res, next) => {
	// No token required, and no access restriction
	userRolesObject = UserRoles.roleIDs;
	userType = req.params.userType;
	// Check the subroute is set
	if(userType) {
		// Check that the subroute is valid (the user has specified a valid user type)
		if(userRolesObject.hasOwnProperty(userType)) {
			userRole = userRolesObject[userType]; // e.g. roleIDs['admin'] = 900
			// Check that the request contains all required user details
			if(
			   req.body.email && req.body.password && 
			   req.body.firstName && req.body.lastName
			) {
				// Check if the email is already registered
				Users.isEmailRegistered(req.body.email, (err, result) => {
					if(err) {
						JsonResponse.sendError(res, 500, 'email_registered_query_error', err);
					} else {
						if(result[0].matches > 0) {
							JsonResponse.sendError(res, 409, 
								'email_already_registered', 'The email address ' + req.query.email + ' is already registered.');
						} else {
							// Hash the password
							Users.hashPassword(req.body.password, (err, hashedPassword) => {
								if(err) {
									JsonResponse.sendError(res, 500, 'bcrypt_error', err);
								} else {
									// Create user object with hashed password
									const user = {
										Email: req.body.email,
										Password: hashedPassword,
										FirstName: req.body.firstName,
										LastName: req.body.lastName
									}
									// Add the new user to the db
									Users.createNewUser(user, (err, result) => {
										if(err) {
											JsonResponse.sendError(res, 500, 'create_user_query_error', err);
										} else {
											// Set the user's role, which we get from the userRolesObject, using the specified userType
											const userDetails = {
												UserId: result.insertId,
												RoleId: userRole,
												StartDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // Consider timezones
											}
											UserRoles.setUserRole(userDetails, (err) => {
												if(err) {
													JsonResponse.sendError(res, 500, 'set_user_role_query_error', err);
												} else {
													JsonResponse.sendSuccess(res, 201, {userId: result.insertId, userRole: userRole});
												}
											})
										}	
									});
								}
							});
						}
					}
				});
			} else {
				JsonResponse.sendError(res, 404, 'missing_required_params', 
					'The server was expecting an email, password, first name and last name. At least of of these parameters was missing from the request.');
			}
		} else {
			JsonResponse.sendError(res, 404, 'invalid_subroute', 
				'An invalid user type was specified in the subroute.');
		}
	} else {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			'Server was expecting a subroute that specifies the type of user to be created.');
	}
});

/**
	Deactivate user
**/

router.put('/deactivate/:userId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be deactivated
	if(!req.headers.authorization || !req.params.userId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const userId = req.params.userId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				JsonResponse.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				const requesterRole = decodedpayload.userRole;
				const requesterId = decodedpayload.userId;
				const waiterAdmin = UserRoles.roleIDs.waiterAdmin;
				// A user can be deactivated only by the owner, or by an internal admin
				if(requesterId != userId && requesterRole != waiterAdmin) {
					JsonResponse.sendError(res, 401, 'unauthorised', 
						'A user account can be deactivated only by the owner, or by an internal admin.');
				} else {
					// Before deactivating the user, check if the account is already active
					Users.getUserById(userId, (err, user) => {
						if(err) {
							JsonResponse.sendError(res, 500, 'get_user_query_error', err);
						} else if(user.length < 1) {
							JsonResponse.sendError(res, 404, 'user_not_found', 
								'A user with the specified Id could not be found.');
						} else {
							const IsActive = user[0].IsActive;
							// Check if the user is active
							if(!IsActive) {
								JsonResponse.sendError(res, 409, 'user_already_inactive', 
									'The server determined that the specified user account is aready inactive. You cannot deactivate an inactive account.');
							} else {
								Users.deactivateUser(userId, (err, result) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'deactivate_user_query_error', err);
									} else if(result.affectedRows < 1) {
										JsonResponse.sendError(res, 404, 'user_not_deactivated', 
											'The query was executed successfully but the user account was not deactivated.');
									} else {
										JsonResponse.sendSuccess(res, 200);
									}	
								});
							}
						}
					});
				}
			}
		});
	}
});

/**
	Update user
**/

/**
	Get user dashboard
**/
router.get('/dashboard/:userId', (req, res, next) => {
		// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.userId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const userId = req.params.userId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				JsonResponse.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				const requesterRole = decodedpayload.userRole;
				const requesterId = decodedpayload.userId;
				const waiterAdmin = UserRoles.roleIDs.waiterAdmin;
				// User details can be accessed only by the owner, or by an internal admin. Future: restaurant details accessible to users granted access by restaurant owner
				if(requesterId != userId && requesterRole != waiterAdmin) {
					JsonResponse.sendError(res, 401, 'unauthorised', 
						'A user\'s details can be accessed only by the owner, or by admins.');
				} else {
					Users.getUserById(req.params.userId, (err, result) => {
						if(err) {
							JsonResponse.sendError(res, 500, 'get_user_query_error', err);
						} else {
							if(result.length < 1) {
								JsonResponse.sendError(res, 404, 'user_not_found', 
									'There are no users matching the ID provided.');
							} else {
								// Return only insensitive user information
								const user = {
									email: result[0].Email, 
									firstName: result[0].FirstName,
									lastName: result[0].LastName,
									imageUrl: result[0].ImageUrl
								}
								Restaurants.getRestaurant(userId, (err, result) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'get_restaurant_query_error', err);
									} else if(result.length < 1) {
										JsonResponse.sendError(res, 404, 'restaurant_not_found', 
									'The user appears to have zero registered restaurants.');
									} else {
										// There may be multiple restaurants owned by a single user; for now, get the first restuarant returned
										const restaurant = {
											name: result[0].Name,
											description: result[0].Description,
											location: result[0].Location,
											phoneNumber: result[0].PhoneNumber,
											emailAddress: result[0].EmailAddress
										}
										JsonResponse.sendSuccess(res, 200, {user: user, restaurant: restaurant});
									}
								});
							}
						}
					});
				}
			}
		});
	}
});



module.exports = router;
