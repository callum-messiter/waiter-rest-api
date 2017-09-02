// Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
// Config
const db = require('../config/database');
const secret = require('../config/jwt').jwt.secret;
/**

	Generate a new json web token (jwt) upon successful login

**/
module.exports.createUserToken = function(userId, callback) {
	const utc_timestamp = new Date().getTime();
	const alg = 'HS256';
	const issuer = 'http://api.waiter.com';
	const iat = utc_timestamp;
	const exp = utc_timestamp + 3600000; // 1 hour from the current time
	jwt.sign({
		algorithm: alg,
		issuer: issuer,
		iat: iat,
		exp: exp,
		userId: userId,
		userRole: 100
	}, secret, callback);
}

/**

	Stores a reference to any generated jwt

**/
module.exports.saveUserTokenReference = function(userToken, callback) {
	const query = 'INSERT INTO tokens SET ?';
	db.query(query, userToken, callback);
}

/**

	Check if token is valid (jwt.verify + check if token has been revoked)

**/
module.exports.verifyToken = function(token, callback) {
	jwt.verify(token, secret, callback);
}

/**

	Delete a token from the db upon logout

**/
module.exports.deleteTokenReference = function(token, userId, callback) {
	const query = 'DELETE FROM tokens WHERE userId = ? AND token = ?';
	db.query(query, [userId, token], callback);
}