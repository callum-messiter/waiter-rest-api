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
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
// Config
const secret = require('../config/jwt').secret;
const modifiableUserDetails = Users.schema.requestBodyParams;
const e = require('../helpers/error').errors;

// TODO: export this function into a helper
function allRequiredParamsProvided(reqBody, rp) {
	for(var i = 0; i < rp.length; i++) {
		const param = rp[i]
		if(reqBody[param] == undefined) {
			return false;
		}
	}
	return true;
}

/**
	Get single user by ID
**/
router.get('', (req, res, next) => {
	Users.getUserById(res.locals.authUser.userId)
	.then((u) => {

		if(u.length < 1) throw e.userNotFound;
		return res.status(200).json({
			data: {
				userId: u[0].userId,
				email: u[0].email, 
				firstName: u[0].firstName,
				lastName: u[0].lastName,
				//isVerified: u[0].isVerified,
				//isActive: u[0].isActive
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

/**
	Create a new restaurateur
**/
router.post('/r', (req, res, next) => {
	res.locals.newUser = {role: UserRoles.roleIDs['restaurateur']}

	const rp = ['email', 'password', 'firstName', 'lastName', 'userType', 'restaurantName'];
	if(!allRequiredParamsProvided(req.body, rp)) throw e.missingRequiredParams;

	Users.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return Users.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		return Users.createNewUser(user);

	}).then((result) => {

		const userDetails = {
			userId: res.locals.newUser.userId,
			roleId: res.locals.newUser.role,
			startDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
		}
		return UserRoles.setUserRole(userDetails);

	}).then((result) => {

		// Create the user's restaurant, and the default menu with default categories
		const restaurant = {
			ownerId: res.locals.newUser.userId,
			restaurantId: shortId.generate(),
			name: req.body.restaurantName
		};
		const menu = {
			restaurantId: restaurant.restaurantId,
			menuId: shortId.generate(),
			name: 'Main Menu'
		};
		res.locals.newUser.restaurant = restaurant;
		res.locals.newUser.menu = menu;

		return Restaurants.createRestaurantWithDefaultMenu(restaurant, menu);

	}).then((result) => {

		return res.status(201).json({
			user: {
				userId: res.locals.newUser.userId, 
				userRole: res.locals.newUser.role,
				//isVerified: false,
			},
			restaurant: res.locals.newUser.restaurant,
			menu: res.locals.newUser.menu
		});

	}).catch((err) => {
		return next(err);
	});
});

/**
	Create a new diner
**/
router.post('/d', (req, res, next) => {
	res.locals.newUser = {role: UserRoles.roleIDs['diner']}

	const rp = ['email', 'password', 'firstName', 'lastName', 'userType'];
	if(!allRequiredParamsProvided(req.body, rp)) throw e.missingRequiredParams;

	Users.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return Users.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		return Users.createNewUser(user);

	}).then((result) => {

		const userDetails = {
			userId: res.locals.newUser.userId,
			roleId: res.locals.newUser.role,
			startDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
		}
		return UserRoles.setUserRole(userDetails);

	}).then((result) => {

		return res.status(201).json({
			user: {
				userId: res.locals.newUser.userId, 
				userRole: res.locals.newUser.role,
				//isVerified: false,
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

/**
	Deactivate user
**/
router.put('/deactivate/:userId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be deactivated
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.invalidRequest(res, ['userId']);
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
					ResponseHelper.unauthorised(res, 'user account');
				} else {
					// Before deactivating the user, check if the account is already active
					Users.getUserById(userId, (err, user) => {
						if(err) {
							ResponseHelper.sql(res, 'getUserById', err);
						} else if(user.length < 1) {
							ResponseHelper.resourceNotFound(res, 'user');
						} else {
							const IsActive = user[0].IsActive;
							// Check if the user is active
							if(!IsActive) {
								ResponseHelper.customError(res, 409, 'user_already_inactive', 
									'The server determined that the specified user account is aready inactive. You cannot deactivate an inactive account.',
									'This account has already been deactivated. To re-activate it, click here.'
								);
							} else {
								Users.deactivateUser(userId, (err, result) => {
									if(err) {
										ResponseHelper.sql(res, 'deactivateUser', err);
									} else if(result.affectedRows < 1) {
										ResponseHelper.customError(res, 404, 'user_not_deactivated', 
											'The query was executed successfully but the user account was not deactivated.',
											ResponseHelper.msg.default.user
										);
									} else {
										ResponseHelper.customSuccess(res, 200);
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
		ResponseHelper.invalidRequest(res, ['userId']);
	} else {
		if(!req.body.firstName && !req.body.lastName) {
			ResponseHelper.missingRequiredData(res, ['firstName', 'lastName']);
		} else {
			const token = req.headers.authorization;
			const userId = req.params.userId;
			const userDetails = req.body;
			// Check that the body params are allowed; write an external helper function for this
			const requestDataIsValid = RequestHelper.checkRequestDataIsValid(userDetails, modifiableUserDetails, res);
			if(requestDataIsValid !== true) {
				ResponseHelper.customError(res, 422, 'invalid_data_params', 
					"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.",
					ResponseHelper.msg.default.user
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
							ResponseHelper.unauthorised(res, 'user account');
						} else {
							// Update user details
							Users.updateUserDetails(userId, userDetails, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'updateUserDetails', err);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.customSuccess(res, 200);					
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
		ResponseHelper.invalidRequest(res, ['userId']);
	} else if(!req.body.currentPassword || !req.body.newPassword) {
		ResponseHelper.missingRequiredData(res, ['currentPassword', 'newPassword']);
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
					ResponseHelper.unauthorised(res, 'user account');
				} else {
					// Check that the user has entered a password that is different from their current password
					if(newPassword == currentPassword) {
						ResponseHelper.customError(res, 409, 'password_conflict', 
							'The new password provided is the same as the user\'s current password.',
							'The new password you entered is already assigned to your account. Please log in, or provide a different new password.'
						);
					} else {
						// Get the user's current hashed password
						Users.getUserById(userId, (err, result) => {
							if(err) {
								ResponseHelper.sql(res, 'getUserById', err);
							} else if(result.length < 1) {
								ResponseHelper.resourceNotFound(res, 'user');
							} else {
								const currentHashedPass = result[0].password;
								const currentPlainTextPass = currentPassword;

								// Check that the user has entered their current password correctly
								Users.checkPassword(currentPlainTextPass, currentHashedPass, (err, passwordsMatch) => {
									if(err) {
										ResponseHelper.sql(res, 'checkPassword', err);
									} else if(!passwordsMatch) {
										ResponseHelper.customError(res, 401, 'invalid_password', 
											'The currentPassword provided does not match the user\'s current password in the database.',
											'The password you entered is incorrect. Please enter your current password, or reset it.');
									} else if(passwordsMatch){
										// Hash the new password
										Users.hashPassword(newPassword, (err, newHashedPassword) => {
											if(err) {
												ResponseHelper.customError(res, 500, 'bcrypt_error',
													'There was an error with the bcrypt package: ' + err,
													ResponseHelper.msg.default.user
												);
											} else {
												// Update user details
												Users.updateUserPassword(userId, newHashedPassword, (err, result) => {
													if(err) {
														ResponseHelper.sql(res, 'updateUserPassword', err);
													} else if(result.changedRows < 1) {
														QueryHelper.diagnoseQueryError(result, res);
													} else {
														// Invalidate the current token
														ResponseHelper.customSuccess(res, 200);					
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

module.exports = router;
