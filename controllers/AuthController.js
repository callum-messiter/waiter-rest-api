// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');
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
								Auth.createUserToken(user[0].UserId, (err, token) => {
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
										// Decode token and get userId and exp
										const decodedToken = jwt.decode(token);
										const tokenUserId = decodedToken.userId;
										// Get expirary date of token
										const tokenExp = decodedToken.exp;
										const expiresAt = moment(tokenExp).format('YYYY-MM-DD HH:mm:ss');
										// Get current datetime
										const currentDate = new Date();
										const now = moment(currentDate).format('YYYY-MM-DD HH:mm:ss');
										// Add the token to the db for reference
										const userToken = {
											UserId: tokenUserId,
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
													// Return the relevant user details to the client
													res.status(200).json({
														success: true,
														error: '',
														userId: user[0].UserId,
														role: userRole[0].RoleId,
														token: token
													});
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
	if(!req.query.userId || !req.headers.authorization) {
		res.status(404).json({
			success: false,
			error: 'missing_required_params',
			msg: 'The server was expecting a userId and a token. At least one of these parameters was missing from the request.'
		});
	} else {
		const token = req.headers.authorization;
		const userId = req.query.userId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				res.status(401).json({
					success: false,
					error: 'invalid_token',
					msg: 'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.'
				});
			} else {
				// Delete the token from the DB (the token will be invalidated/deleted by the client)
				Auth.deleteTokenReference(token, userId, (err, result) => {
					if(err) {
						res.status(500).json({
							success: false,
							error: 'deleting_token_query_error',
							msg: 'The server tried to delete the token in the database, but failed.'
						});
					} else {
						if(result.affectedRows < 1) {
							res.status(404).json({
								success: false,
								error: 'error_deleting_token_ref',
								msg: 'The server executed the query successfully, but nothing was deleted. It\'s likely that there exists no combination of the supplied userId and token.'
							});
						} else {
							res.status(200).json({
								success: true,
								error: ''
							});
						}
					}
				});
			}
		});
	}
});

module.exports = router;