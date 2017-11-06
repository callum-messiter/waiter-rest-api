module.exports.sendError = function(res, statusCode, errorKey, devMsg, userMsg, success=false) {
	res.status(statusCode).json({success, errorKey, devMsg, userMsg});
}

module.exports.sendSuccess = function(res, statusCode, data={}, success=true) {
	res.status(statusCode).json({success, data});
}

module.exports.msg = {
	default: 'An error occured. Please try again, and if the issue persists, contact support.',
	sql: 'There was an SQL error: '
}

module.exports.invalidToken = function(res) {
	res.status(401).json({
		success: false, 
		errorKey: 'invalid_token', 
		devMsg: 'The auth token is invalid; it likely expired. Please log the user out and destroy the token on the client side.', 
		userMsg: 'Your session has expired. Please log in again to begin a new session.'
	});
}