const db = require('../config/database');

module.exports.roleIDs = {
	'diner': 100,
	'restaurateur': 200,
	'admin': 900
}

module.exports.setUserRole = function(userDetails, callback) {
	const query = 'INSERT INTO userroles SET ?'
	db.query(query, userDetails, callback);
}