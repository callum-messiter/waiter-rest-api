const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const Auth = require('../models/Auth');
const Users = require('../models/Users');

router.get('/', (req, res, next) => {
	const currentDate = new Date();
	console.log(currentDateTime = moment(currentDate).format('YYYY-MM-DD HH:mm:ss'));
	console.log(tokenExpirationDateTime = moment(currentDate).add(50, 'years').format('YYYY-MM-DD HH:mm:ss'));
});

router.get('/login', (req, res, next) => {
	// If the user is already logged in (has a valid token), redirect them to the dashboard
	const email = req.query.email;
	const password = req.query.password;
	// CHeck that the email and password were set
	if(email && password) {
		// Check that the email address entered is registered
		Auth.doesUserExist(email, (err, user) => {
			if(err) {
				res.json({
					success: false,
					msg: 'The email address supplied is not registered.'
				});
			} else {
				// Check if the user is active
				if(user[0].IsActive) {
					// Check if the user is verified
					if(!user[0].IsVerified) {
						// Check that the user entered the correct password
						const hashedPassword = user[0].Password;
						bcrypt.compare(password, hashedPassword, (err, passwordsMatch) => {
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

								const token = 'token';
								// Add jwt to the database
								const currentDate = new Date();
								const currentDateTime = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');
								// Token expires in 1 hour for real accounts, in 50 years for test accounts
								if(user[0].IsTestAccount) {
									tokenExpirationDateTime = moment(currentDate).add(50, 'years').format('YYYY-MM-DD HH:mm:ss');
								} else {
									tokenExpirationDateTime = moment(currentDate).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
								}
								const userToken = {
									UserId: user[0].UserId,
									Token: token,
									Date: currentDateTime,
									ExpiryDate: tokenExpirationDateTime
								}
								Users.addUserToken(userToken, (err, result) => {
									if(err) {
										res.json({
											success: false,
											msg: err
										});
									} else {
										// CHeck value of result
										res.redirect('/api/dashboard');
									}
								});
							}
						});
					} else {
						res.json({
							success: false, 
							msg: 'This user account is not verified.'
						})
					}
				} else {
					res.json({
						success: false,
						msg: 'This user account is inactive.'
					});
				}
			}
		});
	} else {
		res.json({
			success: false,
			msg: 'The required user parameters were not provided.'
		});
	}
});

router.get('/logout', (req, res, next) => {
	// expire the token - set it to expired in the database
});

module.exports = router;