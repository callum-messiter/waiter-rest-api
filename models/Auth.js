const db = require('../config/database');
const bcrypt = require('bcrypt');

module.exports.checkLoginCredentials = function(username, password, callback) {
	// Check if there is a user in the db with the credentials provided
	// If no results, 
	// Use Bcrypt to compare the password
	const query = ''

}