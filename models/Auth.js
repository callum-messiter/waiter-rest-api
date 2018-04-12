const jwt = require('jsonwebtoken');
const roles = require('../models/UserRoles').roles;
const db = require('../config/database');
const e = require('../helpers/error').errors;
const config = require('../config/config');

/**
	Generate a new json web token (jwt) upon successful login
**/
module.exports.createUserToken = function(userId, userRole) {
	return new Promise((resolve, reject) => {
		const utc_timestamp = new Date().getTime();
		const data = {
			algorithm: config.jwt.alg,
			issuer: config.jwt.issuer,
			iat: utc_timestamp,
			exp: utc_timestamp + (3600000*24*7),
			userId: userId,
			userRole: userRole
		}
		jwt.sign(data, config.jwt.secret, (err, token) => {
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
		jwt.verify(token, config.jwt.secret, (err, decodedPayload) => {
			if(err) return reject(e.jwtMalformed);
			resolve(decodedPayload);
		});
	});
}

module.exports.userHasRequiredRole = function(requesterRoleId, allowedRoles) {
	if (allowedRoles.indexOf(requesterRoleId) === -1) return false;
	return true;
}

/** 
	Customers (100) can access resources they own
	Restaurants (200) can access resources they own
	InternalAdmins (500) can access any resources
**/
module.exports.userHasAccessRights = function(requester, resourceOwnerId) {
	const requesterIsAnAdmin = (requester.userRole == roles.waitrAdmin);
	const requesterOwnsResource = (requester.userId == resourceOwnerId); 
	// If the requester is not an admin, he must be the owner of the resource to access it
	if(!requesterIsAnAdmin && !requesterOwnsResource) return false;
	return true;
}