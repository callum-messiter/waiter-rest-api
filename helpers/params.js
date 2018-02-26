module.exports.paramsMissing = function(req, requiredParams) {
	const queryParams = requiredParams.query;
	for(var i = 0; i < queryParams.length; i++) { if(req.query[queryParams[i]] == undefined) return true; }
	
	const bodyParams = requiredParams.body;
	for(var i = 0; i < bodyParams.length; i++) { if(req.body[bodyParams[i]] == undefined) return true; }
	
	const routeParams = requiredParams.route;
	for(var i = 0; i < routeParams.length; i++) { if(req.params[routeParams[i]] == undefined) return true; }
	
	return false;
}