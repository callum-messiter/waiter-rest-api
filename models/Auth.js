// Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
// Models
const roles = require('../models/UserRoles').roleIDs;
// Config
const db = require('../config/database');
const secret = require('../config/jwt').secret;
const jwtOpts = require('../config/jwt').opts;
const e = require('../helpers/error');

/**
	Generate a new json web token (jwt) upon successful login
**/
module.exports.createUserToken = function(userId, userRole) {
	return new Promise((resolve, reject) => {
		const utc_timestamp = new Date().getTime();
		const data = {
			algorithm: jwtOpts.alg,
			issuer: jwtOpts.issuer,
			iat: utc_timestamp,
			exp: utc_timestamp + (3600000*24*7),
			userId: userId,
			userRole: userRole
		}
		jwt.sign(data, secret, (err, token) => {
			if(err) return reject(err);
			resolve(token);
		});
	});
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
		jwt.verify(token, secret, (err, decodedPayload) => {
			if(err) return reject(e.jwtMalformed);
			resolve(decodedPayload);
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

module.exports.userHasAccessRights = function(requester, resourceOwnerId) {
	/** 
		Players can access resources they own
		Coaches can access resources they own
		InternalAdmins can access any resources
	**/
	const requesterIsAnAdmin = (requester.userRole == roles.internalAdmin);
	const requesterOwnsResource = (requester.userId == resourceOwnerId);
	if(!requesterIsAnAdmin && !requesterOwnsResource) {
		return false;
	}
	return true;
}