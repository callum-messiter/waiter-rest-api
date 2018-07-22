const db = require('../config/database');
const bcrypt = require('bcrypt');
const e = require('../helpers/error').errors;

module.exports.getUserByEmail = (email) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT users.userId, users.firstName, users.lastName, users.email, ' + 
					  'users.password, users.isVerified, users.isActive, userroles.roleId ' +
					  'FROM users ' +
			          'JOIN userroles ON userroles.userId = users.userId ' +
			          'WHERE email = ?';
		db.query(query, email, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllUsers = function() {
	return new Promise((resolve, reject) => {
		const query = 'SELECT email FROM users';
		db.query(query, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getUserById = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE userId = ?';
		db.query(query, userId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.checkPassword = (plainTextPassword, hash) => {
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainTextPassword, hash, (err, passwordsMatch) => {
			if(err) return resolve({ err: err });
			return resolve(passwordsMatch);
		});
	});
}

module.exports.isEmailRegistered = function(email) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE email = ?';
		db.query(query, email, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.hashPassword = function(password) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(11, (err, salt) => {
			if(err) return reject(err);
			bcrypt.hash(password, salt, (err, hash) => {
				if(err) return resolve({ err: err });
			return resolve(hash);
			});
		});
	});
}

module.exports.createNewUser = function(user) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO users SET ?';
		db.query(query, user, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateUserDetails = function(userId, userDetails) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET ? ' +
					  'WHERE userId = ?';
		db.query(query, [userDetails, userId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.updateUserPassword = function(userId, newPassword) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET password = ? ' +
					  'WHERE userId = ?';
		db.query(query, [newPassword, userId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.updateUserEmailAddress = function(userId, newEmailAddress, isVerified=false) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET email = ?, isVerified = ? ' +
					  'WHERE userId = ?';
		db.query(query, [newEmailAddress, isVerified, userId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			if(result.changedRows < 1) return reject({ err: e.alreadyCurrentEmail });
			return resolve(result);
		});
	});
}

module.exports.setUserAsVerified = function(userId) {
	return new Promsie((resolve, reject) => {
		const query = 'UPDATE users SET isVerified = 1 WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			if(result.changedRows < 1) return reject(e.userAlreadyVerified);
			return resolve(result);
		});
	});
}

module.exports.deactivateUser = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET isActive = 0 WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}