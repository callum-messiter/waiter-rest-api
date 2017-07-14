const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');
const Users = require('../models/Users');
const bcrypt = require('bcrypt');

router.get('/', (req, res, next) => {
	res.send('Auth');
});

router.get('/login', (req, res, next) => {
	// If the user is already logged in (has a valid token), redirect them to the dashboard

	// Check that the username and password are set

	// From the query result, check if the user is active
	const user = req.query;

	if('email' in user && 'password' in user) {
		Auth.doesUserExist(req.query.email, (err, queryResult) => {
			if(err) {
				res.json({
					success: false,
					msg: 'The email address supplied is not registered.'
				});
			} else {
				const hashedPassword = queryResult[0].Password;
				bcrypt.compare(req.query.password, hashedPassword, (err, passwordsMatch) => {
					if(err) {
						res.json({
							success: false,
							msg: err
						})
					} else if(!passwordsMatch) {
						res.json({
							success: false,
							msg: 'Incorrect password.'
						});
					} else if(passwordsMatch){
						// Generate jwt

						// Add jwt to the database

						// Redirect user to dashboard
					}
				})
			}
		});
	} else {
		res.json({
			success: false,
			msg: 'The required user parameters were not provided.'
		});
	}
	// From the query result, check if the user is verified

	// If all is fine, generate and return a JWT, add the token to the database
});

router.get('/logout', (req, res, next) => {
	// expire the token - set it to expired in the database
});

module.exports = router;