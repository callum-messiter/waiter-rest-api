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

// Whenever SQL throws an error. The developer should specify the query name (the name of the (query) method called by the controller)
module.exports.sql = function(res, queryName, err) {
	res.status(500).json({
		success: false, 
		errorKey: queryType+'_sql_error', 
		devMsg: 'There was an SQL error: '+err.code,
		userMsg: 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.'
	});
}

module.exports.invalidRequest = function(res, params=[]) {
	res.status(404).json({
		success: false, 
		errorKey: 'invalid_request', 
		devMsg: 'The request must contain an Authorization header, and the following parameters: ' + params,
		userMsg: 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.'
	});
}

module.exports.missingRequiredData = function(res, params) {
	res.status(404).json({
		success: false, 
		errorKey: 'missing_required_data', 
		devMsg: 'The request must contain the following data parameters: ' + params + '.',
		userMsg: 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.'
	});
}	

module.exports.resourceNotFound = function(res, queryName, err) {
	res.status(500).json({
		success: false, 
		errorKey: '', 
		devMsg: '',
		userMsg: ''
	});
}

module.exports.msg = {
	default: 'An error occured. Please try again, and if the issue persists, contact support.',
	sql: 'There was an SQL error: '
}