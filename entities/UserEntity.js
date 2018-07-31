const db = require('../config/database');
const bcrypt = require('bcrypt');
const e = require('../helpers/ErrorHelper').errors;

module.exports.getUserByEmail = (email) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT users.userId, users.firstName, users.lastName, users.email, ' + 
					  'users.password, users.verified, users.active, userroles.roleId ' +
					  'FROM users ' +
			          'LEFT JOIN userroles ON userroles.userId = users.userId ' +
			          'WHERE email = ?';
		db.query(query, email, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllUsers = () => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT email FROM users';
		db.query(query, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getUserById = (userId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE userId = ?';
		db.query(query, userId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.checkPassword = (plainTextPassword, hash) => {
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainTextPassword, hash, (err, passwordsMatch) => {
			if(err) return resolve({ err: err });
			return resolve(passwordsMatch);
		});
	});
}

module.exports.hashPassword = (password) => {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(11, (err, salt) => {
			if(err) return reject(err);
			bcrypt.hash(password, salt, (err, hash) => {
				if(err) return resolve({ err: err });
			return resolve(hash);
			});
		});
	});
}

module.exports.createNewUser = (data) => {
	return new Promise((resolve, reject) => {
		const userObj = {
			userId: data.userId,
			email: data.email,
			password: data.password,
			firstName: data.firstName,
			lastName: data.lastName
		};
		const query = 'INSERT INTO users SET ?';
		db.query(query, userObj, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateUserDetails = (userId, userDetails) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET ? ' +
					  'WHERE userId = ?';
		db.query(query, [userDetails, userId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}