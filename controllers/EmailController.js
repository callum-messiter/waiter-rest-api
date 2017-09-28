// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Emails = require('../models/Emails');
const statuses = Emails.emailVerTokenStatuses;
const Users = require('../models/Users');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const QueryHelper = require('../helpers/QueryHelper');

router.get(Emails.emailVerRoute, (req, res, next) => {
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

module.exports = router;