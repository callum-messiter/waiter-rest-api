const db = require('../config/database');
const bcrypt = require('bcrypt');

/**
	credentials = {
		email: req.query.email,
		Password: req.query.password,
	}
**/

module.exports.doesUserExist = function(username, callback) {
	const query = 'SELECT * FROM Users WHERE email = ?';
	db.query(query, username, callback);
}