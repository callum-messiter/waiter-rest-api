// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
// Models
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');
const JsonResponse = require('../helpers/JsonResponse');

/**
	Create user (diner)
**/
router.get('/createNewDiner', (req, res, next) => {
	// Check that the request contains all user details	
	if(
	   req.query.email && req.query.password && 
	   req.query.firstName && req.query.lastName
	) {
		// Check if the email is already registered
		Users.isEmailRegistered(req.query.email, (err, result) => {
			if(result[0].matches > 0) {
				JsonResponse.sendError(res, 409, 'email_already_registered', 'The email address ' + req.query.email + ' is already registered.');
			} else {
				// Hash the password
				Users.hashPassword(req.query.password, (err, hashedPassword) => {
					if(err) {
						JsonResponse.sendError(res, 500, 'bcrypt_error', err);
					} else {
						// Create user object with hashed password
						const user = {
							Email: req.query.email,
							Password: hashedPassword,
							FirstName: req.query.firstName,
							LastName: req.query.lastName
						}
						// Add the new user to the db
						Users.createNewUser(user, (err, result) => {
							if(err) {
								JsonResponse.sendError(res, 500, 'create_user_query_error', err);
							} else {
								// Set user's role
								const userDetails = {
									UserId: result.insertId,
									RoleId: UserRoles.roleIDs.diner,
									StartDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // Consider timezones
								}
								UserRoles.setUserRole(userDetails, (err) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'set_user_role_query_error', err);
									} else {
										JsonResponse.sendSuccess(res, {userId: result.insertId});
									}
								})
							}
						});
					}
				});
			}
		})
	} else {
		JsonResponse.sendError(res, 404, 'missing_required_params', 'The server was expecting an email, password, first name and last name. At least of of these parameters was missing from the request.');
	}
});

/**
	Get single user by ID
**/
router.get('/:userId', (req, res, next) => {
	Users.getUserById(req.params.userId, (err, user) => {
		if(err) {
			res.json({
				success: 'false',
				msg: err
			});
		} else {
			// Return only insensitive user information
			if(user.length < 1) {
				res.json({
					success: 'false',
					msg: 'There are no users matching the ID provided.'
				})
			} else {
				res.json({
					success: 'true',
					user: user
				});
			}
		}
	})
});

/**
	Get a list of all registered users
**/
router.get('/', (req, res, next) => {
	// Check that the user is an admin
	Users.getAllUsers((err, users) => {
		if(err) {
			JsonResponse.sendError(res, 500, 'get_all_users_query_error', err);
		} else {
			JsonResponse.sendSuccess(res, {users: users});
		}
	})
});

/**
	Delete user
**/

/**
	Update user
**/

module.exports = router;
