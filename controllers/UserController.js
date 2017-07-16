// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
// Models
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');

/**

	User roles:

	'diner': 100,
	'restaurateur': 200,
	'admin': 900

**/

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
				res.json({
					success: 'false',
					error: 'The email address ' + req.query.email + ' is already registered.'
				});
			} else {
				// Hash the password
				Users.hashPassword(req.query.password, (err, hashedPassword) => {
					if(err) {
						res.json({
							success: 'false',
							msg: err
						});
					}
					// Create user object with hashed password
					const user = {
						Email: req.query.email,
						Password: hashedPassword,
						FirstName: req.query.firstName,
						LastName: req.query.lastName
					}
					// If request specifies that the new account is for testing, add this info to the DB
					if(req.query.IsTestAccount) {
						user.IsTestAccount = 1;
					}
					// Add the new user to the db
					Users.createNewUser(user, (err, result) => {
						if(err) {
							res.json({
								success: 'false',
								msg: err
							});
						} else {
							// Set user's role
							const userDetails = {
								UserId: result.insertId,
								RoleId: UserRoles.roleIDs.diner,
								StartDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") // Consider timezones
							}
							UserRoles.setUserRole(userDetails, (err) => {
								// We should log each stage of the creation process: user created, user role set
								if(err) {
									res.json({
										success: 'false',
										msg: err
									});
								} else {
									res.json({
										success: 'true',
										userId: result.insertId
									})
								}
							})
						}
					});
				});
			}
		})
	} else {
		res.json({
			success: 'false',
			msg: 'Missing required parameters.'
		})
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
	Users.getAllUsers((err, users) => {
		if(err) {
			res.json({
				success: 'false',
				msg: err
			});
		} else {
			res.json({
				success: 'true',
				users: users
			});
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
