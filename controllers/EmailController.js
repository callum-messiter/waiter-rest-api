// Dependencies
const express = require('express');
const router = express.Router();
const md5 = require('js-md5');
// Models
const Emails = require('../models/Emails');
const emailRoutes = Emails.emailRoutes;
const statuses = Emails.emailVerTokenStatuses;
const Users = require('../models/Users');
const Auth = require('../models/Auth');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const QueryHelper = require('../helpers/QueryHelper');

router.get('/verifyEmail', (req, res, next) => {
	if(!req.query.uid || !req.query.vt) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a uid and a verification token. At least one of these params was missing.');
	} else {
		const uid = req.query.uid;
		const vt = req.query.vt;
		// Check the database for a the uid-vt combination (is the combo active)
		Emails.validateEmailVerificationToken(uid, vt, (err, result) => {
			if(err) {
				ResponseHelper.sendError(res, 500, 'validate_email_ver_token_query_error', err);
			} else if(result.length < 1) {
				ResponseHelper.sendError(res, 404, 'email_ver_token_not_found', 
					'The query returned zero results. The uid-and-token combination (of any status) could not be found.');
			} else {
				// Check the status of the token so as to provide an informative response
				const status = result[0].status;
				switch(status) {
				    case statuses.used:
				    	ResponseHelper.sendError(res, 409, 'email_ver_token_already_used', 
							'The veriication-token status is "used". The user has already used this token to verify their email account.');
				        break;
				    case statuses.inactive:
				    	ResponseHelper.sendError(res, 401, 'email_ver_token_inactive', 
							'The verification token is inactive. Encourage the client to trigger a new verification email.');
				        break;
				    case statuses.active:
				    	// Set the user.isActive property to 1, and redirect the user to the login route
				    	Users.setUserAsVerified(uid, (err, result) => {
				    		if(err) {
				    			ResponseHelper.sendError(res, 500, 'set_user_valid_query_error', err);
				    		} else if(result.changedRows < 1) {
								QueryHelper.diagnoseQueryError(result, res);
				    		} else {
				    			// Update verification token status
				    			ResponseHelper.sendSuccess(res, 200, {userId: uid, isVerified: true});	    			
				    		}
				    	});
				        break;
				    default:
				    	ResponseHelper.sendError(res, 500, 'unknown_ver_token_status', 
				    		'The verification status token has the unrecognise status ' + status + '. Contact the dev.');
				}
			}
		});
	}
});

/**
	When the user request to rest their password, the client app should make a request to this endpoint.
	Here the url will be constructed, containing a unique token, and this url will be sent to the user via email.
**/
router.get('/requestPasswordReset', (req, res, next) => {
	// We need to check the db for when the user's most recent password-reset request was received. This will help us prevent abuse of feature, and a potential overload of the mail server
	const userId = req.query.userId;
	// Query the db for the user's email and password
	Users.getUserById(userId, (err, result) => {
		const user = result[0];
		if(err) {
			ResponseHelper.sendError(res, 500, 'get_user_query_error', err);
		} else if(result.length < 1) {
			ResponseHelper.sendError(res, 404, 'user_not_found', 
				'The query returned zero results. It is likely that a user with the specified ID does not exist.');
		} else {
			const userCurrentHashedPass = user.password;
			const userEmailAddress = user.email;
			const secret = 'H4FMWP4YifmMcB6kOdPnhlTTVSpljRZq';
			const string = userCurrentHashedPass+secret;
			// Generate a hash containg the user's current (hashed) password, and add it as a claim to the new email-verification jwt. When the user clicks the url in the email we send them,
			// we will decode the jwt, get the hash, generate a new hash using the same data, and compare the two hashes. The two hashes should
			// only differ if the user has already reset their password (thus invalidating the token and the url/email)
			const hash = md5(string);

			Emails.createResetPasswordToken(userId, hash, (err, token) => {
				if(err) {
					ResponseHelper.sendError(res, 500, 'bcrypt_error', err);
				} else {
					// Build the url
					const url = 'http://localhost:3000/api/email/verifyPasswordReset?v='+token;
					// Send the password-reset email containing the url
					const recipient = {
						email: user.email,
						firstName: user.firstName,
						resetUrl: url
					}
					Emails.sendSingleEmail(res, 'passwordReset', recipient, (err, result) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'send_email_error', err);
						} else {
							ResponseHelper.sendSuccess(res, 200, {userId: userId, passResetEmailSent: true});
						}
					});
				}
			});
		}
	});
});

/**
	We will send the user an email with a url that they can click in order to reset their password. 
	The url will be a client-app route, and said route will cantain the request to this endpoint.
**/
router.get('/verifyPasswordReset', (req, res, next) => {
	const vtoken = req.query.v;

	Auth.verifyToken(vtoken, (err, decodedPayload) => {
		const oldHash = decodedPayload.hash;
		const userId = decodedPayload.userId;

		if(err) {
			ResponseHelper.sendError(res, 500, 'vtoken_verification_error', err);
		} else if(!decodedPayload.action || !decodedPayload.action == 'resetPassword') {
			ResponseHelper.sendError(res, 401, 'invalid_ver_token_type', 
				'The decoded payload did not contain the "action" claim with the correct value.');
		} else {
			// Get the user's current hashed password
			Users.getUserById(userId, (err, result) => {
				if(err) {
					ResponseHelper.sendError(res, 500, 'get_user_query_error', err);
				} else if(result.length < 1) {
					ResponseHelper.sendError(res, 404, 'user_not_found', 
						'The query returned zero results. It is likely that a user with the specified ID does not exist.');
				} else {
					const userCurrentHashedPass = result[0].password;
					const secret = 'H4FMWP4YifmMcB6kOdPnhlTTVSpljRZq';
					const string = userCurrentHashedPass+secret;

					// Generate the new hash and compare it with the old one: they will be the same unless the user has already reset their password
					const newHash = md5(string);
					if(oldHash != newHash) {
						ResponseHelper.sendError(res, 401, 'invalid_reset_pass_token', 
							'It is likely that the user has already used this rest-password token, by clicking the url we emailed to them, and successfully updating their password.');
					} else {
						ResponseHelper.sendSuccess(res, 200, {userId: userId});
					}
				}
			});
		}
	});
});

module.exports = router;