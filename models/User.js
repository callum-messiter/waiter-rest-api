const db = require('../config/database');
const bcrypt = require('bcrypt');
const e = require('../helpers/error').errors;

/*
	As we migrate to async-await, we will use only the async-await version of the method, and remove the non-async-await version 
	once it's no longer it use
*/
module.exports.async = {
	getUserByEmail: (email) => {
		const response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'SELECT users.userId, users.firstName, users.lastName, users.email, ' + 
						  'users.password, users.isVerified, users.isActive, userroles.roleId ' +
						  'FROM users ' +
				          'JOIN userroles ON userroles.userId = users.userId ' +
				          'WHERE email = ?';
			db.query(query, email, (err, users) => {
				if(err) {
					response.error = err;
				} else {
					response.data = users;
				}
				return resolve(response);
			});
		});
	},
	checkPassword: (plainTextPassword, hash) => {
		const response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			bcrypt.compare(plainTextPassword, hash, (err, passwordsMatch) => {
				if(err) {
					response.error = err;
				} else {
					response.data = passwordsMatch;
				}
				return resolve(response);
			});
		});
	}
}

/**
	Checks if a user exists by running an email address against the db. Returns true if a match is found
**/
module.exports.isEmailRegistered = function(email) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE email = ?';
		db.query(query, email, (err, users) => {
			if(err) return reject(err);
			resolve(users);
		});
	});
}

/**
	Hashes the user's password upon signup
**/
module.exports.hashPassword = function(password) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(11, (err, salt) => {
			if(err) return reject(err);
			bcrypt.hash(password, salt, (err, hash) => {
				if(err) return reject(err);
				resolve(hash);
			});
		});
	});
}

/**
	Compares the user's login password with their hashed password that is stored in the db
**/
module.exports.checkPassword = function(plainTextPassword, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainTextPassword, hash, (err, passwordsMatch) => {
			if(err) return reject(err);
			// if(passwordsMatch === false) return reject(err='invalid_password');
			resolve(passwordsMatch);
		});
	});
}

/**
	(ADMIN-ONLY): Returns a list of all registered email addresses
**/
module.exports.getAllUsers = function() {
	return new Promise((resolve, reject) => {
		const query = 'SELECT email FROM users';
		db.query(query, (err, users) => {
			if(err) return reject(err);
			resolve(users);
		});
	});
}

/**
	Search the db for a userId, and returns the user if a match is found
**/
module.exports.getUserById = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE userId = ?';
		db.query(query, userId, (err, users) => {
			if(err) return reject(err);
			resolve(users);
		});
	});
}

/**
	Checks if a user exists by running an email address against the db. Returns the match if found
**/
module.exports.getUserByEmail = function(email) {
	return new Promise((resolve, reject) => {
		const query = 
		'SELECT users.userId, users.firstName, users.lastName, users.email, users.password, users.isVerified, users.isActive, ' +
		'userroles.roleId FROM users ' +
		'JOIN userroles ON userroles.userId = users.userId ' +
		'WHERE email = ?';
		db.query(query, email, (err, users) => {
			if(err) return reject(err);
			resolve(users);
		});
	});
}

/**
	Create new user with a specified user type 
**/
module.exports.createNewUser = function(user) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO users SET ?';
		db.query(query, user, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

/**
	Update the user's details. Refer to the schema to see info about editable parameters
**/
module.exports.updateUserDetails = function(userId, userDetails) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET ? ' +
					  'WHERE userId = ?';
		db.query(query, [userDetails, userId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}

module.exports.updateUserPassword = function(userId, newPassword) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET password = ? ' +
					  'WHERE userId = ?';
		db.query(query, [newPassword, userId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}

module.exports.updateUserEmailAddress = function(userId, newEmailAddress, isVerified=false) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET email = ?, isVerified = ? ' +
					  'WHERE userId = ?';
		db.query(query, [newEmailAddress, isVerified, userId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.alreadyCurrentEmail);
			resolve(result);
		});
	});
}

/**
	Verify the user's email account
**/
module.exports.setUserAsVerified = function(userId) {
	return new Promsie((resolve, reject) => {
		const query = 'UPDATE users SET isVerified = 1 WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.userAlreadyVerified);
			resolve(result);
		});
	});
}

/**
	"Deletes" a user (sets their isActive property to 0)
**/
module.exports.deactivateUser = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET isActive = 0 WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.resourceAlreadyInactive);
			resolve(result);
		});
	});
}