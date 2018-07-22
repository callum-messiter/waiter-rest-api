const db = require('../config/database');
const e = require('../helpers/error').errors;

module.exports.roles = {
	diner: 100,
	restaurateur: 200,
	waitrAdmin: 900
}

module.exports.roleIDs = {
	diner: 100,
	restaurateur: 200,
	internalAdmin: 500,
	externalAdmin: 900
}

module.exports.setUserRole = function(userDetails) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO userroles SET ?'
		db.query(query, userDetails, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.getUserRole = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT roleId FROM userroles WHERE userId = ?';
		db.query(query, userId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}