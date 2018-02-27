const jwt = require('jsonwebtoken');
const roles = require('../models/UserRoles').roleIDs;
const db = require('../config/database');
const secret = require('../config/jwt').secret;
const jwtOpts = require('../config/jwt').opts;
const e = require('../helpers/error').errors;

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
	Customers (100) can access resources they own
	Restaurants (200) can access resources they own
	InternalAdmins (500) can access any resources
**/
module.exports.userHasAccessRights = function(requester, resourceOwnerId) {
	// We may need to add a basic role check, although access is implicitly denied to "unauthorised" user types via the resource-ownership check
	const requesterIsAnAdmin = (requester.userRole == roles.internalAdmin);
	const requesterOwnsResource = (requester.userId == resourceOwnerId); 
	if(!requesterIsAnAdmin && !requesterOwnsResource) {
		return false;
	}
	return true;
}