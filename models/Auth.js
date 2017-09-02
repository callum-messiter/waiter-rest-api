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
	const expiresAt = utc_timestamp + 3600000; // 1 hour from the current time
	jwt.sign({userId: userId, exp: expiresAt}, secret, callback);
}

/**

	Stores a reference to any generated jwt

**/
module.exports.saveUserTokenReference = function(userToken, callback) {
	const query = 'INSERT INTO tokens SET ?';
	db.query(query, userToken, callback);
}



/**

	Set user access session (req.session.rserId, req.session.roleId, req.session.token)

**/

/**

	Check if token is valid (jwt.verify + check if token has been revoked)

**/

module.exports.verifyToken = function(token, callback) {
	jwt.verify(token, secret, callback);
}

/**

	Check if token has been revoked on the clientside 

**/

/**

	Delete a token from the db upon logout

**/