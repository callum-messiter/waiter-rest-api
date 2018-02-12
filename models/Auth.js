// Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
// Config
const db = require('../config/database');
const secret = require('../config/jwt').secret;
const jwtOpts = require('../config/jwt').opts;

/**
	Generate a new json web token (jwt) upon successful login
**/
module.exports.createUserToken = function(userId, userRole, callback) {
	const utc_timestamp = new Date().getTime();
	const alg = jwtOpts.alg;
	const issuer = jwtOpts.issuer;
	const iat = utc_timestamp;
	const exp = utc_timestamp + (3600000*24*7); // 1 week from the current time
	jwt.sign({
		algorithm: alg,
		issuer: issuer,
		iat: iat,
		exp: exp,
		userId: userId,
		userRole: userRole
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
module.exports.verifyToken = function(token) {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

/**
	Delete a token from the db upon logout
**/
module.exports.deleteTokenReference = function(token, userId) {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM tokens WHERE userId = ? AND token = ?';
		db.query(query, [userId, token], (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}