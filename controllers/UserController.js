const express = require('express');
const router = express.Router();
const Users = require('../models/Users');
const bcrypt = require('bcrypt');

/**
	Create user
**/
router.get('/create', (req, res, next) => {
	// Check if the email is already registered
	Users.isEmailRegistered(req.query.email, (err, result) => {
		if(result[0].matches > 0) {
			res.json({
				success: 'false',
				error: 'The email address ' + req.query.email + ' is already registered.'
			});
		} else {
			// Hash the password
			Users.encryptPassword(req.query.password, (err, salt) => {
				if(err) {
					res.json({
						success: 'false',
						msg: err
					});
				}
				// Create user object with hashed password
				const user = {
					Email: req.query.email,
					Password: salt,
					FirstName: req.query.firstName,
					LastName: req.query.lastName
				}
				// If request spcificies the new account is for testing, add this info to the DB
				if(req.query.IsTestAccount) {
					user.IsTestAccount = 1;
				}
				// Add the new user to the db
				Users.create(user, (err) => {
					if(err) {
						res.json({
							success: 'false',
							msg: err
						});
					} else {
						res.json({
							success: 'true',
							msg: 'New user account created.'
						});
					}
				});
			});
		}
	});
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
