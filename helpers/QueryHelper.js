// Helpers
const JsonResponse = require('./JsonResponse');

module.exports.diagnoseQueryError = function(result, res) {
	// Was the item found in the DB?
	const msg = result.message;
	const itemFound = 'Rows matched: 1';
	if(msg.includes(itemFound)) {
		const itemUpdated = 'Changed: 1';
		// Was the item found, but not updated?
		if(!msg.includes(itemUpdated)) {
			JsonResponse.sendError(res, 409, 'data_already_exists', 
				'The resource was found but not changed. This is likely because the new resource details provided already exist in the database.');
		// This is a MySQL contradiction that should never arise
		} else {
			JsonResponse.sendError(res, 500, 'error_contradiction', 
				'The server determined that zero rows were changed, and one row was changed. Contact the dev.');
		}
	} else {
		JsonResponse.sendError(res, 404, 'item_not_found', 
			'A resource with the specified ID was not found.');
	}
}