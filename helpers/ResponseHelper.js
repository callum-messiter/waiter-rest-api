module.exports.sendError = function(res, statusCode, errorKey, devMsg, userMsg, success=false) {
	res.status(statusCode).json({success, errorKey, devMsg, userMsg});
}

module.exports.sendSuccess = function(res, statusCode, data={}, success=true) {
	res.status(statusCode).json({success, data});
}