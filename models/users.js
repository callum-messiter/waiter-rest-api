// Depdendencies
const bcrypt = require('bcrypt');
// Config
const db = require('../config/database');

module.exports.schema = {
	userId: '',
	email: '',
	password: '',
	firstName: '',
	lastName: '',
	isVerified: '',
	isActive: '',
	imageUrl: '',
	// The parameters that can be passed in the body of the request when a user wishes to update their details
	requestBodyParams: {
		email: '',
		password: '',
		firstName: '',
		lastName: '',
		imageUrl: ''
	}
}

/**
	Search the db for a userId, and returns the user if a match is found
**/
module.exports.getUserById = function(userId, callback) {
	const query = 'SELECT * FROM users WHERE userId = ?';
	db.query(query, userId, callback);
}

/**
	(ADMIN-ONLY): Returns a list of all registered email addresses
**/
module.exports.getAllUsers = function(callback) {
	const query = 'SELECT email FROM users';
	db.query(query, callback);
}


/**
	Create new user with a specified user type 
**/
module.exports.createNewUser = function(user, callback) {
	const query = 'INSERT INTO users SET ?';
	db.query(query, user, callback);
}

module.exports.getMenuDetails = function(menuId, callback) {
	const query = 'SELECT menus.menuId, menus.name, restaurants.restaurantId, restaurants.name AS restaurantName ' +
				  'FROM menus ' +
				  'JOIN restaurants on restaurants.restaurantId = menus.restaurantId ' + 
				  'WHERE menuId = ?';
	db.query(query, menuId, callback);
}

/**
	Checks if a user exists by running an email address against the db. Returns the match if found
**/
module.exports.getUserByEmail = function(email) {
	return new Promise((resolve, reject) => {
		const query = 
		'SELECT users.userId, users.email, users.password, users.isVerified, users.isActive, ' +
		'userroles.roleId FROM users ' +
		'JOIN userroles ON userroles.userId = users.userId ' +
		'WHERE email = ?';
		db.query(query, email, (err, user) => {
			if(err) return reject(err);
			resolve(user);
		});
	});
}

/**
	Checks if a user exists by running an email address against the db. Returns true if a match is found
**/
module.exports.isEmailRegistered = function(email, callback) {
	const query = 'SELECT COUNT(*) AS matches FROM users WHERE Email = ?';
	db.query(query, email, callback);
}

/**
	Hashes the user's password upon signup
**/
module.exports.hashPassword = function(password, callback) {
	bcrypt.genSalt(11, (err, salt) => {
		bcrypt.hash(password, salt, callback);
	});
}

/**
	Compares the user's login password with their hashed password that is stored in the db
**/
module.exports.checkPassword = function(plainTextPassword, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainTextPassword, hash, (err, result) => {
			if(err) return reject(err);
			// if(result === false) return reject(err='invalid_password');
			resolve(result);
		});
	});
}

/**
	"Deletes" a user (sets their isActive property to 0)
**/
module.exports.deactivateUser = function(userId, callback) {
	const query = 'UPDATE users SET isActive = 0 WHERE userId = ?';
	db.query(query, userId, callback);
}

/**
	Verify the user's email account
**/
module.exports.setUserAsVerified = function(userId, callback) {
	const query = 'UPDATE users SET isVerified = 1 WHERE userId = ?';
	db.query(query, userId, callback);
}

/**
	Update the user's details. Refer to the schema to see info about editable parameters
**/
module.exports.updateUserDetails = function(userId, userDetails, callback) {
	const query = 'UPDATE users SET ? ' +
				  'WHERE userId = ?';
	db.query(query, [userDetails, userId], callback);
}

module.exports.updateUserPassword = function(userId, newPassword, callback) {
	const query = 'UPDATE users SET password = ? ' +
				  'WHERE userId = ?';
	db.query(query, [newPassword, userId], callback);
}

module.exports.updateUserEmailAddress = function(userId, newEmailAddress, isVerified=false, callback) {
	const query = 'UPDATE users SET email = ?, isVerified = ? ' +
				  'WHERE userId = ?';
	db.query(query, [newEmailAddress, isVerified, userId], callback);
}