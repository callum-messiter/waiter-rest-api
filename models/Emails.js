// Dependencies
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
// Config
const db = require('../config/database');
const smtp = require('../config/smtp');
const secret = require('../config/jwt').secret;
const jwtOpts = require('../config/jwt').opts;

/**
	The query params that will be affixed to the email-verification route, and parsed once the user clicks the link in their verification email
**/
module.exports.emailVerRouteQueryParams = {
	userId: 'uid',
	verificationToken: 'vt'
}

/**
	The statuses an email-verification token can have	
**/
module.exports.emailVerTokenStatuses = {
	active: 100,
	used: 200, 
	inactive: 300
}

/**
	The handlebars in each template
**/
const handlebars = {
	emailVerification: {
		firstName: '{{firstName}}',
		url: '{{verificationUrl}}'
	},
	passwordReset: {
		firstName: '{{firstName}}',
		resetUrl: '{{resetUrl}}'
	},
	updateEmailAddress: {
		firstName: '{{firstName}}',
		updateUrl: '{{updateUrl}}'
	}
}

/**
	Nodemailer Transporter object, with SMTP credentials 
**/
const transporter = nodemailer.createTransport({
	service: 'gmail',
	secure: false,
	auth: {
		user: smtp.creds.email,
		pass: smtp.creds.pass
	},
	tls: {
		rejectUnauthorised: false
	}
});

/**
	Static email options
**/
const emailOpts = {
	from: '"waiter" <no-reply@waiter.com'
}

/**
	Send the email contaiing the variable data
**/
module.exports.sendSingleEmail = function(res, templateName, recipient, callback) {
	this.getTemplate(templateName, (err, result) => {
		// This err line may be a problem later (but the query should never fail) - shameful
		if(err) {
			ResponseHelper.sendError(res, 500, 'get_user_query_error', err);
		} else {
			// Get the email data and store it in the emailOpts object
			var emailOpts = {
				from: result[0].from,
				to: recipient.email,
				subject: result[0].subject
			}

			// Parse the body for handlebars and inject the user details
			var body = result[0].body;
			emailOpts = injectDataIntoBody(templateName, body, recipient, emailOpts, handlebars, res);

			// Send the email
			transporter.sendMail(emailOpts, callback);
		}
	});
}

/**
	Get the relevant email template from the database
**/
module.exports.getTemplate = function(templateName, callback) {
	const query = 'SELECT subject, body, senderEmail, senderName ' +
				  'FROM emailtemplates ' +
				  'WHERE name = ?';
	db.query(query, templateName, callback);
}

/**
	Parse the email template body for handlebars. It is imperative that the handlbars 
	in the templates correspond exactly to those in the handlebars object.
**/
function injectDataIntoBody(templateName, body, recipient, emailOpts, handlebars, res) {
	if(templateName in handlebars) {
		// Loop through the handlebars and inject the crresponding variable
		for(const key of Object.keys(handlebars[templateName])) {
			// Replace the handlebar in the body with the corresponding value 
		    body = body.replace(handlebars[templateName][key], recipient[key]);
		}
	} else {
		ResponseHelper.sendError(res, 500, 'template_name_not_in_handlebars',
			templateName + ' was not found in the handlebars object. Contact the dev.');
	}
	emailOpts.text = body;
	return emailOpts;
}

/**
	Add a new template to the database
**/
module.exports.createNewTemplate = function(template, callback) {
	const query = 'INSERT INTO emailtemplates SET ?';
	db.query(query, template, callback);
}
/**
	Add the email-verification token to the database
**/
module.exports.storeVerificationToken = function(data, callback) {
	const query = 'INSERT INTO verification SET ?';
	db.query(query, data, callback);
}

/**
	Check that there exists a valid email erification
**/
module.exports.validateEmailVerificationToken = function(userId, token, callback) {
	const query = 'SELECT status FROM verification ' +
				  'WHERE userId = ? AND token = ?';
	db.query(query,[userId, token], callback);
}

/**
	Update the status of an email-verification token; e.g. invalidate it if it has expired
**/
module.exports.updateEmailVerificationTokenStatus = function(userId, token, status, callback) {
	const query = 'UPDATE verification SET status = ? ' +
				  'WHERE userId = ? AND token = ?';
	db.query(query, [userId, token, status], callback);
}

/**
	Here we generate the token that will be affixed to the url we will send the user when requesting they verify their email account
**/
module.exports.createEmailVerificationToken = function(userId, hash, callback) {
	const utc_timestamp = new Date().getTime();
	const alg = jwtOpts.alg;
	const issuer = jwtOpts.issuer;
	const action = 'verifyEmail';
	const iat = utc_timestamp;
	const exp = utc_timestamp + 3600000; // 1 hour from the current time
	jwt.sign({
		algorithm: alg,
		issuer: issuer,
		action: action,
		iat: iat,
		exp: exp,
		userId: userId,
		hash: hash
	}, secret, callback);
}

/**
	Here we generate the token that will be affixed to the url we will send the user when they request to reset their password
**/
module.exports.createResetPasswordToken = function(userId, hash, callback) {
	const utc_timestamp = new Date().getTime();
	const alg = jwtOpts.alg;
	const issuer = jwtOpts.issuer;
	const action = 'resetPassword';
	const iat = utc_timestamp;
	const exp = utc_timestamp + 3600000; // 1 hour from the current time
	jwt.sign({
		algorithm: alg,
		issuer: issuer,
		action: action,
		iat: iat,
		exp: exp,
		userId: userId,
		hash: hash
	}, secret, callback);
}

/**
	Here we generate the token that will be affixed to the url we will send the user when they request to reset their password
**/
module.exports.createUpdateEmailVerificationToken = function(userId, hash, newEmailAddress, callback) {
	const utc_timestamp = new Date().getTime();
	const alg = jwtOpts.alg;
	const issuer = jwtOpts.issuer;
	const action = 'verifyNewEmailAddress';
	const iat = utc_timestamp;
	const exp = utc_timestamp + 3600000; // 1 hour from the current time
	jwt.sign({
		algorithm: alg,
		issuer: issuer,
		action: action,
		iat: iat,
		exp: exp,
		userId: userId,
		newEmail: newEmailAddress,
		hash: hash
	}, secret, callback);
}

// The above 3 functions should be a single function, which take as an argument the action