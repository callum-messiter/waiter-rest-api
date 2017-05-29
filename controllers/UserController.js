const express = require('express');
const router = express.Router();
const Users = require('../models/Users');
const bcrypt = require('bcrypt');

router.get('/create', (req, res, next) => {
	// Check if the email is already registered
	Users.isEmailRegistered(req.query.email, (err, result) => {
		if(result[0].matches > 0) {
			res.json(response = {
				success: 'false',
				error: 'The email address ' + req.query.email + ' is already registered. If you forgot your password, you can reset it here.'
			});
		} else {
			// Hash the password
			Users.encryptPassword(req.query.password, (err, salt) => {
				if(err) {
					res.json(response = {
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
				// Add the new user to the db
				Users.create(user, (err) => {
					if(err) {
						res.json(response = {
							success: 'false',
							msg: err
						});
					} else {
						res.json(response = {
							success: 'true',
							msg: 'Success! Thanks for registering with waiter, ' + user.firstName + '. '
						});
					}
				});
			});
		}
	});
});

module.exports = router;
