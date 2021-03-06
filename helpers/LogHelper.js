const bunyan = require('bunyan');
const path = require('path');
const e = require('./ErrorHelper');

/* trace -> level 10 */
module.exports.trace = function(reqPath, errKey, type, requester) {
	getLogger(type).trace(
		'Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error *' + errKey + '*'
	);
}

/* debug -> level 20 */
module.exports.debug = function(reqPath, errKey, type, requester) {
	getLogger(type).debug(
		'Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error *' + errKey + '*'
	);
}

/* info -> level 30 */
module.exports.info = function(reqPath, errKey, type, requester) {
	getLogger(type).info(
		'Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error *' + errKey + '*'
	);
}

/* warn -> level 40 */
module.exports.warn = function(reqPath, errKey, type, requester) {
	getLogger(type).warn(
		'Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error *' + errKey + '*'
	);
}

/* error -> level 50 */
module.exports.error = function(reqPath, requester, err) {
	getLogger(err.type).error(err);
	//'Endpoint *' + reqPath + '*; user *' + requester + '*; error *' + errKey + '() *'
}

module.exports.undhandledError = function(reqPath, err, requester) {
	getLogger(e.errorTypes.unhandled).error(
		'Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error: ' + err
	);
}

module.exports.clientSideError = function(msg, type) {
	getLogger(type).error(msg);
}

module.exports.lkError = function(err) {
	getLogger('_liveKitchen').error(err);
}

module.exports.lkInfo = function(msg) {
	getLogger('_liveKitchenInfo').info(msg);
}

function getLogger(type) {
	return bunyan.createLogger({
	    name: type,
	    streams: [{
	        path: "logs/" + type + ".log"
	    }]
	});
}