module.exports.checkRequestDataIsValid = function(requestBody, schema, res) {
	for(const k in requestBody) {
		if(!schema.hasOwnProperty(k)) {
			return k;
		}
	}
	return true;
}