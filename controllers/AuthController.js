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
const UserRoles = require('../models/UserRoles');

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
				res.status(404).json({
					success: false,
					error: 'unregistered_email_address',
					msg: 'The email address supplied is not registered.'
				});
			} else {
				// Check if the user is active
				if(user[0].IsActive) {
					// Check if the user is verified
					if(user[0].IsVerified) {
						// Check that the user entered the correct password
						const plainTextPassword = password;
						const hashedPassword = user[0].Password
						Users.checkPassword(plainTextPassword, hashedPassword, (err, passwordsMatch) => {
							if(err) {
								res.status(500).json({
									success: false,
									error: 'bcrypt_error',
									msg: err
								})
							} else if(!passwordsMatch) {
								res.status(401).json({
									success: false,
									error: 'invalid_password',
									msg: 'The email account is registered but the password provided is invalid.'
								});
							} else if(passwordsMatch){
								// Generate token
								Auth.createUserToken(user[0].UserId, secret, (err, token) => {
									if(err) {
										res.status(500).json({
											success: false,
											error: 'jwt_error',
											msg: err
										});
									} else if(token == null) {
										res.status(500).json({
											success: false,
											error: 'jwt_token_null',
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
												res.status(500).json({
													success: false,
													error: 'token_not_added_to_db',
													msg: err
												});
											} else {
												// Get the user's role
												UserRoles.getUserRole(user[0].UserId, (err, userRole) => {
													if(err) {
														res.status(500).json({
															success: false,
															error: 'get_user_role_error',
															msg: err
														});
													}
													// Return the generated jwt
													res.status(200).json({
														success: true,
														error: '',
														userId: user[0].UserId,
														role: userRole[0].RoleId,
														token: token
													})
												});
											}
										});
									}
								});
							}
						});
					} else {
						res.status(401).json({
							success: false, 
							error: 'user_not_verified',
							msg: 'This user account is not verified.'
						})
					}
				} else {
					res.status(401).json({
						success: false,
						error: 'user_not_active',
						msg: 'This user account is inactive. The account was either suspended by waiter, or deactivated by the user.'
					});
				}
			}
		});
	} else {
		res.status(404).json({
			success: false,
			error: 'missing_required_params',
			msg: 'The request must contain an email address and password. The request contained: ' + JSON.stringify(req.query)
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