// Helpers
const ResponseHelper = require('./ResponseHelper');

module.exports.diagnoseQueryError = function(result, res) {
	// Was the item found in the DB?
	const msg = result.message;
	const itemFound = 'Rows matched: 1';
	if(msg.includes(itemFound)) {
		const itemUpdated = 'Changed: 1';
		// Was the item found, but not updated?
		if(!msg.includes(itemUpdated)) {
			ResponseHelper.sendError(res, 409, 'data_already_exists', 
				'The resource was found but not changed. This is likely because the new resource details provided already exist in the database.');
		} else {
			// Since this function is only called when MySQL says zero rows were changed, this is a contradiction that should never arise
			ResponseHelper.sendError(res, 500, 'schroedingers_error', 
				'The server determined that zero rows were changed, and one row was changed. Contact the dev.');
		}
	} else {
		ResponseHelper.sendError(res, 404, 'resource_not_found', 
			'A resource with the specified ID was not found.');
	}
}