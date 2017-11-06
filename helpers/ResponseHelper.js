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