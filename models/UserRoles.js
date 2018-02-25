const db = require('../config/database');
const e = require('../helpers/error').errors;

/**
	The available roles. {roleTitle: roleId}
**/
module.exports.roleIDs = {
	diner: 100,
	restaurateur: 200,
	internalAdmin: 500,
	externalAdmin: 900
}

/**
	Sets the user's role
**/
module.exports.setUserRole = function(userDetails) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO userroles SET ?'
		db.query(query, userDetails, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
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