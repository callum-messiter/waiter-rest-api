/**
	For custom errors
**/

module.exports.sendError = function(res, statusCode, errorKey, devMsg, userMsg, success=false) {
	res.status(statusCode).json({success, errorKey, devMsg, userMsg});
}

module.exports.sendSuccess = function(res, statusCode, data={}, success=true) {
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
		devMsg: 'This user account does not have permission to access or modify the specified ' + resourceType,
		userMsg: 'Sorry, you don\'t have permission to do that!'
	});
}

module.exports.msg = {
	default: 'An error occured. Please try again, and if the issue persists, contact support.',
	sql: 'There was an SQL error: '
}