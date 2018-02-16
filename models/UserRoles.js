// Config
const db = require('../config/database');

/**
	The available roles. {roleTitle: roleId}
**/
module.exports.roleIDs = {
	'diner': 100,
	'restaurateur': 200,
	'internalAdmin': 500,
	'externalAdmin': 900
}

/**
	Sets the user's role
**/
module.exports.setUserRole = function(userDetails, callback) {
	const query = 'INSERT INTO userroles SET ?'
	db.query(query, userDetails, callback);
}

/**
	Gets the user's role
**/
module.exports.getUserRole = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT roleId FROM userroles WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}