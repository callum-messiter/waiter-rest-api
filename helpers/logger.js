const bunyan = require('bunyan');
const path = require('path');

/* trace -> level 10 */
module.exports.trace = function(reqPath, errKey, type, requester) {
	getLogger(type).trace(' *' + reqPath + '*' + ' -> ' + errKey);
}

/* debug -> level 20 */
module.exports.debug = function(reqPath, errKey, type, requester) {
	getLogger(type).debug(JSON.stringify({
		requesterId: requester,
		endpoint: reqPath,
		errKey: errKey 
	}));
}

/* info -> level 30 */
module.exports.info = function(reqPath, errKey, type, requester) {
	getLogger(type).info(JSON.stringify({
		requesterId: requester,
		endpoint: reqPath,
		errKey: errKey 
	}));
}

/* warn -> level 40 */
module.exports.warn = function(reqPath, errKey, type, requester) {
	getLogger(type).warn(JSON.stringify({
		requesterId: requester,
		endpoint: reqPath,
		errKey: errKey 
	}));
}

/* error -> level 50 */
module.exports.error = function(reqPath, errKey, type, requester) {
	getLogger(type).error('Endpoint *' + reqPath + '* requested by user *' + requester + '*; returned error *' + errKey + '*');
}

function getLogger(type) {
	return bunyan.createLogger({
	    name: type,
	    streams: [{
	        path: "logs/" + type + ".log"
	    }]
	});
}