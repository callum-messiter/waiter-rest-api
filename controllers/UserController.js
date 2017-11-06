// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const md5 = require('js-md5');
const shortId = require('shortid');
// Models
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');
const Auth = require('../models/Auth');
const Restaurants = require('../models/Restaurants');
const Emails = require('../models/Emails');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
// Config
const secret = require('../config/jwt').secret;
const modifiableUserDetails = Users.schema.requestBodyParams;

/**
	Get a list of all registered users
**/
router.get('/', (req, res, next) => {
	// Check that the user is a waiterAdmin
	Users.getAllUsers((err, users) => {
		if(err) {
			ResponseHelper.sendError(res, 500, 'get_all_users_query_error',
				ResponseHelper.msg.sql+err.code,
				ResponseHelper.msg.default
			);
		} else {
			ResponseHelper.sendSuccess(res, 200, {users: users});
		}
	})
});

/**
	Get single user by ID
**/
router.get('/:userId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting the req param 'userId', and the 'Authorization' header.",
			ResponseHelper.msg.default
		);
	} else {
		const userId = req.params.userId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				const requesterId = decodedpayload.userId;

				Users.getUserById(userId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_user_query_error',
							ResponseHelper.msg.sql+err.code,
							ResponseHelper.msg.default
						);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'user_not_found', 
							'There are no users matching the ID provided.',
							ResponseHelper.msg.default
						);
					} else {
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != userId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A user\'s details can be accessed only by the owner, or by admins.',
								"Sorry, you don't have permission to do that!"
							);
						} else {
							// Return only insensitive user information
							user = {
								userId: result[0].userId,
								email: result[0].email, 
								firstName: result[0].firstName,
								lastName: result[0].lastName,
								isVerified: result[0].isVerified,
								isActive: result[0].isActive
							}
							ResponseHelper.sendSuccess(res, 200, user);
						}
					}
				});
			}
		});
	}
});

/**
	Create user 
**/
router.post('/create', (req, res, next) => {
	// No token required, and no access restriction
	const userRolesObject = UserRoles.roleIDs;
	// Check the subroute is set
	if(!req.body.userType) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting the req param "userType".',
			ResponseHelper.msg.default
		);
	} else {
		const userType = req.body.userType;
		// Check that the subroute is valid (the user has specified a valid user type)
		if(!userRolesObject.hasOwnProperty(userType)) {
			ResponseHelper.sendError(res, 404, 'invalid_user_type', 
				'" + ' + userType + '" is not a valid user type.',
				ResponseHelper.msg.default
			);
		} else {
			userRole = userRolesObject[userType]; // e.g. roleIDs['admin'] = 900
			// Check that the request contains all required user details
			if(
			   !req.body.email || !req.body.password || 
			   !req.body.firstName || !req.body.lastName || !req.body.restaurantName
			) {
				ResponseHelper.sendError(res, 404, 'missing_required_params', 
					'The server was expecting the req params "email", "password", "firstName", "lastName", and "restaurantName".',
					ResponseHelper.msg.default
				);
			} else {
				// Check if the email is already registered
				Users.isEmailRegistered(req.body.email, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'email_registered_query_error',
							ResponseHelper.msg.sql+err.code,
							ResponseHelper.msg.default
						);
					} else {
						if(result[0].matches > 0) {
							ResponseHelper.sendError(res, 409, 
								'email_already_registered', 'The email address ' + req.body.email + ' is already registered.');
						} else {
							// Hash the password
							Users.hashPassword(req.body.password, (err, hashedPassword) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'bcrypt_error', 
										'There was an error with the bcrypt package: ' + err,
										ResponseHelper.msg.default
									);
								} else {
									// Create user object with hashed password
									const user = {
										userId: shortId.generate(),
										email: req.body.email,
										password: hashedPassword,
										firstName: req.body.firstName,
										lastName: req.body.lastName
									}
									// Add the new user to the db
									Users.createNewUser(user, (err, result) => {
										if(err) {
											ResponseHelper.sendError(res, 500, 'create_user_query_error',
												ResponseHelper.msg.sql+err.code,
												ResponseHelper.msg.default
											);
										} else {
											const userId = user.userId;
											// Set the user's role, which we get from the userRolesObject, using the specified userType
											const userDetails = {
												userId: userId,
												roleId: userRole,
												startDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // Consider timezones
											}

											UserRoles.setUserRole(userDetails, (err) => {
												if(err) {
													ResponseHelper.sendError(res, 500, 'set_user_role_query_error',
														ResponseHelper.msg.sql+err.code,
														ResponseHelper.msg.default
													);
												} else {
													// Create the user's restaurant, and the default menu with default categories
													const restaurant = {
														ownerId: userId,
														restaurantId: shortId.generate(),
														name: req.body.restaurantName
													};
													const menu = {
														restaurantId: restaurant.restaurantId,
														menuId: shortId.generate(),
														name: 'Main Menu'
													};

													Restaurants.createRestaurantWithDefaultMenu(restaurant, menu, (err, result) => {
														if(err) {
															ResponseHelper.sendError(res, 500, 'create_restaurant_and_menu_query_error',
																ResponseHelper.msg.sql+err.code,
																ResponseHelper.msg.default
															);
														} else {
															ResponseHelper.sendSuccess(res, 201, {
																user: {
																	userId: userId, 
																	userRole: userRole,
																	isVerified: false,
																},
																restaurant: restaurant,
																menu: menu
															});
															/**
																Email verification goes here
															**/
														}
													});
												}
											})
										}	
									});
								}
							});
						}
					}
				});
			}
		}
	}
});

/**

EMAIL VERIFICATION

// Generate a hash containg the user's current isVerified value, and add it as a claim to the new email-verification jwt. When the user clicks the url in the email we send them,
// we will decode the jwt, get the hash, generate a new hash using the same data, and compare the two hashes. The two hashes should
// only differ if the user has already verified their email account (thus invalidating the token and the url/email)
const userCurrentVerifiedStatus = 0;
const string = userCurrentVerifiedStatus+secret;
const hash = md5(string);

Emails.createEmailVerificationToken(userId, hash, (err, token) => {
	if(err) {
		ResponseHelper.sendError(res, 500, 'create_email_ver_token_query_error', err);
	} else {
		const recipient = {
			email: user.email,
			firstName: user.firstName,
			url: 'http://localhost:3000/api/email/verifyEmail?v='+token
		};
		// Send email
		Emails.sendSingleEmail(res, 'emailVerification', recipient, (err, result) => {
			if(err) {
				ResponseHelper.sendError(res, 500, 'send_email_error', err);
			} else {
				// Add the verification token to the database
				const data = {
					userId: userId, 
					token: token
				}
				Emails.storeVerificationToken(data, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'store_email_ver_token_query_error', err);
					} else {
						response.user = {
							userId: userId, 
							userRole: userRole,
							isVerified: false,
						};
						ResponseHelper.sendSuccess(res, 201, response);
					}
				});
			}
		});
	}
});

**/

/**
	Deactivate user
**/
router.put('/deactivate/:userId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be deactivated
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting the req param 'userId', and the 'Authorization' header.",
			ResponseHelper.msg.default
		);
	} else {
		const userId = req.params.userId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				const requesterRole = decodedpayload.userRole;
				const requesterId = decodedpayload.userId;
				const waiterAdmin = UserRoles.roleIDs.waiterAdmin;
				// A user can be deactivated only by the owner, or by an internal admin
				if(requesterId != userId && requesterRole != waiterAdmin) {
					ResponseHelper.sendError(res, 401, 'unauthorised', 
						'A user account can be deactivated only by the owner, or by an internal admin.',
						"Sorry, you don't have permission to do that!"
					);
				} else {
					// Before deactivating the user, check if the account is already active
					Users.getUserById(userId, (err, user) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'get_user_query_error',
								ResponseHelper.msg.sql+err.code,
								ResponseHelper.msg.default
							);
						} else if(user.length < 1) {
							ResponseHelper.sendError(res, 404, 'user_not_found', 
								'A user with the specified Id could not be found.',
								ResponseHelper.msg.default
							);
						} else {
							const IsActive = user[0].IsActive;
							// Check if the user is active
							if(!IsActive) {
								ResponseHelper.sendError(res, 409, 'user_already_inactive', 
									'The server determined that the specified user account is aready inactive. You cannot deactivate an inactive account.',
									'This account has already been deactivated. To re-activate it, click here.'
								);
							} else {
								Users.deactivateUser(userId, (err, result) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'deactivate_user_query_error',
											ResponseHelper.msg.sql+err.code,
											ResponseHelper.msg.default
										);
									} else if(result.affectedRows < 1) {
										ResponseHelper.sendError(res, 404, 'user_not_deactivated', 
											'The query was executed successfully but the user account was not deactivated.',
											ResponseHelper.msg.default
										);
									} else {
										ResponseHelper.sendSuccess(res, 200);
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
router.put('/updateDetails/:userId', (req, res, next) => {
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting the req param 'userId', and the 'Authorization' header.",
			ResponseHelper.msg.default
		);
	} else {
		if(!req.body.firstName && !req.body.lastName) {
			ResponseHelper.sendError(res, 404, 'missing_required_params', 
				'The server received zero valid parameters to be updated.',
				ResponseHelper.msg.default
			);
		} else {
			const token = req.headers.authorization;
			const userId = req.params.userId;
			const userDetails = req.body;
			// Check that the body params are allowed; write an external helper function for this
			const requestDataIsValid = RequestHelper.checkRequestDataIsValid(userDetails, modifiableUserDetails, res);
			if(requestDataIsValid !== true) {
				ResponseHelper.sendError(res, 422, 'invalid_data_params', 
					"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.",
					ResponseHelper.msg.default
				);
			} else {
				Auth.verifyToken(token, (err, decodedpayload) => {
					if(err) {
						ResponseHelper.invalidToken(res);
					} else {
						const ownerId = userId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A user can modify only their own details.',
								"Sorry, you don't have permission to do that!"
							);
						} else {
							// Update user details
							Users.updateUserDetails(userId, userDetails, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'update_user_query_error',
										ResponseHelper.msg.sql+err.code,
										ResponseHelper.msg.default
									);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.sendSuccess(res, 200);					
								}
							});
						}
					}
				});
			}
		}
	}
});

/**
	Update a user's password 
**/
router.put('/updatePassword/:userId', (req, res, next) => {
	// Check the request contains the required data
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting the req param 'userId', and the 'Authorization' header.",
			ResponseHelper.msg.default
		);
	} else if(!req.body.currentPassword || !req.body.newPassword) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting the req params "newPassword" and "currentPassword".',
			ResponseHelper.msg.default
		);
	} else {
		const token = req.headers.authorization;
		const userId = req.params.userId;
		const currentPassword = req.body.currentPassword;
		const newPassword = req.body.newPassword;

		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				const ownerId = userId;
				const requesterId = decodedpayload.userId;
				// A user can update only their own password
				if(requesterId != ownerId) {
					ResponseHelper.sendError(res, 401, 'unauthorised', 
						'A user can modify only their own details.',
						"Sorry, you don't have permission to do that!"
					);
				} else {
					// Check that the user has entered a password that is different from their current password
					if(newPassword == currentPassword) {
						ResponseHelper.sendError(res, 409, 'password_conflict', 
							'The new password provided is the same as the user\'s current password.',
							'The new password you entered is already assigned to your account. Please log in, or provide a different new password.'
						);
					} else {
						// Get the user's current hashed password
						Users.getUserById(userId, (err, result) => {
							if(err) {
								ResponseHelper.sendError(res, 500, 'get_user_query_error',
									ResponseHelper.msg.sql+err.code,
									ResponseHelper.msg.default
								);
							} else if(result.length < 1) {
								ResponseHelper.sendError(res, 404, 'user_not_found', 
									'The query returned zero results. It is likely that a user with the specified ID does not exist.',
									ResponseHelper.msg.default
								);
							} else {
								const currentHashedPass = result[0].password;
								const currentPlainTextPass = currentPassword;

								// Check that the user has entered their current password correctly
								Users.checkPassword(currentPlainTextPass, currentHashedPass, (err, passwordsMatch) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'bcrypt_error',
											ResponseHelper.msg.sql+err.code,
											ResponseHelper.msg.default
										);
									} else if(!passwordsMatch) {
										ResponseHelper.sendError(res, 401, 'invalid_password', 
											'The currentPassword provided does not match the user\'s current password in the database.',
											'The password you entered is incorrect. Please enter your current password, or reset it.');
									} else if(passwordsMatch){
										// Hash the new password
										Users.hashPassword(newPassword, (err, newHashedPassword) => {
											if(err) {
												ResponseHelper.sendError(res, 500, 'bcrypt_error',
													'There was an error with the bcrypt package: ' + err,
													ResponseHelper.msg.default
												);
											} else {
												// Update user details
												Users.updateUserPassword(userId, newHashedPassword, (err, result) => {
													if(err) {
														ResponseHelper.sendError(res, 500, 'update_password_query_error',
															ResponseHelper.msg.sql+err.code,
															ResponseHelper.msg.default
														);
													} else if(result.changedRows < 1) {
														QueryHelper.diagnoseQueryError(result, res);
													} else {
														// Invalidate the current token
														ResponseHelper.sendSuccess(res, 200);					
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

router.put('updateEmail/:userId', (req, res, next) => {
	// Check the headers and request params
	// Check that the body contains the newEmailAddress param
	// Send an email to the new email address
});


module.exports = router;
