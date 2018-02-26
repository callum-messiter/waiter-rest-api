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

// TODO: can/should we make this a middleware function (in the same way that we will make the checkRequestParameters a middleware function)?
// In each route specification, we will add, as well as the requiredParams, the allowedRoles = []; 
// THE CHALLENGE: getting the resourceOwnerId and storing it in res.locals.
// This is hard because the query varies depending on the resource (getMenuOwnerId, getItemOwnerId etc.)
// We could write a single method for this with a switch statement; each case is a resource, and
// each resource has a corresponding: const query = 'SELECT {colName} FROM {tableName} WHERE {fieldName} = res.locals.resourceId'
// We will have to set the res.locals.resourceId = req.params.{resourceId}

// Return two errors: if the user doesn't have the required role; insufficientRolePrivileges.
// If the user is not an admin and doesn't own , return accessDenied

// We may also later check that the requester has been granted access rights by the resource owner. 
// There will be a DB table called "adminaccess", which will contain the ownerId and the adminId
// The query will check: is there a row where ownerId = resourceOwnerId, and adminId = requester.userId

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