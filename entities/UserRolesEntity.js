const db = require('../config/database');
const e = require('../helpers/ErrorHelper').errors;

module.exports.roles = {
	diner: 100,
	restaurateur: 200
}

module.exports.roleIDs = {
	diner: 100,
	restaurateur: 200
}

module.exports.setUserRole = (data) => {
	return new Promise((resolve, reject) => {
		const detailsObj = {
			userId: data.userId,
			roleId: data.roleId,
			startDate: data.startDate
		};
		const query = 'INSERT INTO userroles SET ?'
		db.query(query, detailsObj, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.getUserRole = (userId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT roleId FROM userroles WHERE userId = ?';
		db.query(query, userId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}