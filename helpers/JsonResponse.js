module.exports.sendError = function(res, statusCode, error, msg, success=false) {
	res.status(statusCode).json({
		success: success,
		error: error,
		msg: msg
	});
}

module.exports.sendSuccess = function(res, statusCode, data={}, error='', success=true) {
	res.status(statusCode).json({success: success, error: error, data: data});
}