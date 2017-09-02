module.exports.sendError = function(res, statusCode, error, msg, success=false) {
	res.status(statusCode).json({
		success: success,
		error: error,
		msg: msg
	});
}