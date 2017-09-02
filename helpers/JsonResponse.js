module.exports.sendError = function(res, statusCode, error, msg, success=false) {
	res.status(statusCode).json({
		success: success,
		error: error,
		msg: msg
	});
}

module.exports.sendSuccess = function(res, data=null, error='', statusCode=200, success=true) {
	response = {
		success: success,
		error: error
	}
	if(data != null) {
		response.data = data;
	}
	res.status(statusCode).json({response});
}