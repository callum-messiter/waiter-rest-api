// Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Config
const db = require('../config/database');

/**

	Generate a new json web token (jwt) upon successful login

**/
module.exports.createUserToken = function(userId, secret, callback) {
	jwt.sign({userId: userId, exp: 3600}, secret, callback);
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

/**

	Check if token has been revoked on the clientside 

**/

/**

	Delete a token from the db upon logout

**/