const db = require('../config/database');
const bcrypt = require('bcrypt');

module.exports.getUserById = function(userId, callback) {
	const query = 'SELECT * FROM users WHERE UserId = ?';
	db.query(query, userId, callback);
}

module.exports.getAllUsers = function(callback) {
	const query = 'SELECT email FROM users';
	db.query(query, callback);
}


/**
	user = {
		Email: req.query.email,
		Password: req.query.password,
		FirstName: req.query.firstName,
		LastName: req.query.lastName
	}

**/

module.exports.createNewUser = function(user, callback) {
	const query = 'INSERT INTO users SET ?';
	db.query(query, user, callback);
}

module.exports.isEmailRegistered = function(email, callback) {
	const query = 'SELECT COUNT(*) AS matches FROM users WHERE Email = ?';
	db.query(query, email, callback);
}

module.exports.hashPassword = function(password, callback) {
	bcrypt.genSalt(11, (err, salt) => {
		bcrypt.hash(password, salt, callback);
	});
}

module.exports.checkPassword = function(plainTextPassword, hash, callback) {
	bcrypt.compare(plainTextPassword, hash, callback);
}

module.exports.addUserToken = function(userToken, callback) {
	const query = 'INSERT INTO tokens SET ?';
	db.query(query, userToken, callback);
}