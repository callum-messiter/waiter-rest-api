/**
	For custom errors
**/

module.exports.customError = function(res, statusCode, errorKey, devMsg, userMsg, success=false) {
	res.status(statusCode).json({success, errorKey, devMsg, userMsg});
}

module.exports.customSuccess = function(res, statusCode, data={}, success=true) {
	res.status(statusCode).json({success, data});
}

/**
	Predfined errors, which are sent multiple times througout the API
**/

// When the user's auth token is found to be invalid
module.exports.invalidToken = function(res) {
	res.status(401).json({
		success: false, 
		errorKey: 'invalid_token', 
		devMsg: 'The auth token is invalid; it likely expired. Please log the user out and destroy the token on the client side.', 
		userMsg: 'Your session has expired. Please log in again to begin a new session.'
	});
}

// When the user is not the owner of the resource, or the user's role does not permit them to access a particular resource 
module.exports.unauthorised = function(res, resourceType) {
	res.status(401).json({
		success: false, 
		errorKey: 'unauthorised', 
		devMsg: 'This user account does not have permission to access or modify the specified '+resourceType,
		userMsg: 'Sorry, you don\'t have permission to do that!'
	});
}

// Whenever SQL throws an error. The developer should specify the query name (the name of the (query) method called by the controller)
module.exports.sql = function(res, queryName, err) {
	res.status(500).json({
		success: false, 
		errorKey: queryType+'_sql_error', 
		devMsg: 'There was an SQL error: '+err.code,
		userMsg: this.msg.default.user
	});
}

// When the request is missing the Auth header or a request parameter
module.exports.invalidRequest = function(res, params=[]) {
	res.status(400).json({
		success: false, 
		errorKey: 'invalid_request', 
		devMsg: 'The request must contain an Authorization header, and the following parameters: '+params,
		userMsg: this.msg.default.user
	});
}

// When the request is missing a required data parameter
module.exports.missingRequiredData = function(res, params) {
	res.status(400).json({
		success: false, 
		errorKey: 'missing_required_data', 
		devMsg: 'The request must contain the following data parameters: '+params+'.',
		userMsg: this.msg.default.user
	});
}	

// When a query is performed to retrieve a resource, and the query returns zero matches
module.exports.resourceNotFound = function(res, resourceType) {
	res.status(404).json({
		success: false, 
		errorKey: resourceType+'_not_found', 
		devMsg: 'The query returned zero results. The '+resourceType+' could not be found in the database.',
		userMsg: this.msg.default.user
	});
}

/**
	Predefined, reusable error messages
**/	
module.exports.msg = {
	default: {
		dev: '',
		user: 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.'
	},
	auth: {
		invalidLogin: {
			dev: 'The email-password combination does not exist in the database.',
			user: 'The username and password you entered did not match our records. Please double-check and try again.'
		},
		inactiveUser: {
			dev: 'This user account is inactive. The account was either suspended by waiter, or deactivated by the user.',
			user: 'This account is not currently active. You can restore your account by clicking here.'
		},
		unverifiedUser: {
			dev: 'This user account is not verified. The user should have a verification email in the inbox of their registered email account. If not, request another one.',
			user: 'This account is not verified. Please check your email inbox for a verification email from waiter.'
		}
	}
}