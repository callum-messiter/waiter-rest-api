module.exports.paramsMissing = (req, requiredParams) => {
	for(const p of requiredParams.query) {
		if(req.query[p] === undefined) return true;
	}
	
	for(const p of requiredParams.body) {
		if(req.body[p] === undefined) return true;
	}
	
	for(const p of requiredParams.route) {
		if(req.params[p] === undefined) return true;
	}
	
	return false;
}

/* A request can contain any combination of editable parameters */
module.exports.buildObjBasedOnParams = (params, editableParams) => {
	let obj = {};
	for(const p of editableParams) {
		if(params[p]) {
			obj[p] = params[p];
		}
	}
	return obj;
}

module.exports.noValidParams = (params, editableParams) => {
	let noValidParams = true;
	for(const p of editableParams) {
		if(params[p]) {
			noValidParams = false;
		}
	}
	return noValidParams;
}