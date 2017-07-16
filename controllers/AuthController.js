// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
// Config
const secret = require('../config/jwt').jwt.secret;
// Models
const Auth = require('../models/Auth');
const Users = require('../models/Users');

router.get('/', (req, res, next) => {
});

/**

	User login

**/
router.get('/login', (req, res, next) => {
	// If the user is already logged in (has a valid token), redirect them to the dashboard
	const email = req.query.email;
	const password = req.query.password;
	// CHeck that the email and password were set
	if(email && password) {
		// Check that the email address entered is registered
		Users.doesUserExist(email, (err, user) => {
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
						Users.checkPassword(password, hashedPassword, (err, passwordsMatch) => {
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
								// Generate token
								Auth.createUserToken(user[0].UserId, secret, (err, token) => {
									if(err) {
										res.json({
											success: false,
											msg: err
										});
									} else if(token == null) {
										res.json({
											success: false,
											msg: 'Error creating token.'
										});
									} else {
										const currentDate = new Date();
										const now = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');
										const expiresAt = moment(currentDate).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
										const userToken = {
											UserId: user[0].UserId,
											Token: token,
											Date: now,
											ExpiryDate: expiresAt
										}
										// Add token to the db for reference
										Auth.saveUserTokenReference(userToken, (err, result) => {
											if(err) {
												res.json({
													success: false,
													msg: err
												});
											} else {
												// Return the generated jwt
												res.json({
													success: true,
													token: token
												})
											}
										});
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

/**

	User logout

**/
router.get('/logout', (req, res, next) => {
	// Get the token, get the userId (req.session object, perhaps)
	// Delete the token from the db
});

module.exports = router;