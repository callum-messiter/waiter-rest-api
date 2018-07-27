const jwt = require('jsonwebtoken');
const roles = require('../entities/UserRolesEntity').roles;
const db = require('../config/database');
const e = require('../helpers/ErrorHelper').errors;
const config = require('../config/config');

module.exports.createUserToken = (userId, userRole) => {
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
			if(err) return resolve({ err: err });
			return resolve(token);
		});
	});
}

module.exports.verifyToken = (token) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, config.jwt.secret, (err, decodedPayload) => {
			if(err) return resolve({ err: err });
			return resolve(decodedPayload);
		});
	});
}