const db = require('../config/database');
const userRolesTable = 'userroles';

module.exports.roleIDs = {
	'diner': 100,
	'restaurateur': 200,
	'admin': 900
}

module.exports.setUserRole = function(userDetails, callback) {
	const query = 'INSERT INTO userroles SET ?'
	db.query(query, userDetails, callback);
}

module.exports.getUserRole = function(userId, callback) {
	const query = 'SELECT RoleId FROM userroles WHERE UserId = ?';
	db.query(query, userId, callback);
}