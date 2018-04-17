const log = require('./logger');

const errorTypes = {
	auth: '_auth',
	db:'_db',
	item: '_item',
	category: '_category',
	menu: '_menu',
	restaurant: '_restaurant',
	user: '_user',
	order: '_order',
	liveKitchen: '_liveKitchen',
	clientSide: '_clientSide',
	unhandled: '_unhandled'
}

// Default error message for client to render to user
const defaultUserMsg = 'The waiter system experienced an error - please try again. If the issue persists, contact our support team.';

/**
	When adding a new error, ensure that the key of the error object has the same name as its errorKey value
	
	When when returning one of these errors, simply reference it by the keys below. The error handling middleware
	will handle building the error response.
**/
const errors = {
	/**
		Auth
	**/
	missingRequiredHeaders: {
		statusCode: 400,
		errorKey: 'missingRequiredHeaders',
		type: errorTypes.auth,
		userMsg: defaultUserMsg
	},
	missingRequiredParams: {
		statusCode: 400,
		errorKey: 'missingRequiredParams',
		type: errorTypes.auth,
		userMsg: defaultUserMsg
	},
	jwtMalformed: {
		statusCode: 401,
		errorKey: 'jwtMalformed',
		type: errorTypes.auth,
		userMsg: 'Oops! Your session has expired. Log in to continue using waitr.'
	},
	insufficientRolePrivileges: {
		statusCode: 403,
		errorKey: 'insufficientRolePrivileges',
		type: errorTypes.auth,
		userMsg: defaultUserMsg
	},
	insufficientPermissions: {
		statusCode: 403,
		errorKey: 'insufficientPermissions',
		type: errorTypes.auth,
		userMsg: defaultUserMsg
	},
	emailNotRegistered: {
		statusCode: 401,
		errorKey: 'emailNotRegistered',
		type: errorTypes.auth,
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	passwordIncorrect: {
		statusCode: 401,
		errorKey: 'passwordIncorrect',
		type: errorTypes.auth,
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	userNotActive: {
		statusCode: 401,
		errorKey: 'userNotActive',
		type: errorTypes.auth,
		userMsg: 'This account is not currently active. You can restore your account by clicking here.'
	},

	/**
		Users
	**/
	userNotFound: {
		statusCode: 404,
		errorKey: 'userNotFound',
		type: errorTypes.user,
		userMsg: defaultUserMsg
	},
	emailAlreadyRegistered: {
		statusCode: 404,
		errorKey: 'emailAlreadyRegistered',
		type: errorTypes.user,
		userMsg: 'That email address is already registered to an account! If you\'ve forgotten your password, contact support.'
	},
	currentPasswordIncorrect: {
		statusCode: 401,
		errorKey: 'currentPasswordIncorrect',
		type: errorTypes.user,
		userMsg: 'Incorrect password. Please double-check and try again.'
	},
	userAlreadyVerified: {
		statusCode: 409,
		errorKey: 'userAlreadyVerified',
		type: errorTypes.user,
		userMsg: 'Your account is already verified. Go ahead and log in.'
	},
	alreadyCurrentEmail: {
		statusCode: 409,
		errorKey: 'alreadyCurrentEmail',
		type: errorTypes.user,
		userMsg: 'That email address is already registered to your account. Go ahead and log in.'
	},

	/**
		Restaurants
	**/
	restaurantNotFound: {
		statusCode: 404,
		errorKey: 'restaurantNotFound',
		type: errorTypes.restaurant,
		userMsg: defaultUserMsg
	},
	restaurantDetailsNotFound: {
		statusCode: 404,
		errorKey: 'restaurantDetailsNotFound',
		type: errorTypes.restaurant,
		userMsg: defaultUserMsg
	},

	/**
		Menus
	**/
	menuNotFound: {
		statusCode: 404,
		errorKey: 'menuNotFound',
		type: errorTypes.menu,
		userMsg: defaultUserMsg
	},

	/**
		Categories
	**/
	categoryNotFound: {
		statusCode: 404,
		errorKey: 'categoryNotFound',
		type: errorTypes.category,
		userMsg: defaultUserMsg
	},

	/**
		Items
	**/
	itemNotFound: {
		statusCode: 404,
		errorKey: 'itemNotFound',
		type: errorTypes.item,
		userMsg: defaultUserMsg
	},

	/**
		Orders
	**/
	orderNotFound: {
		statusCode: 404,
		errorKey: 'orderNotFound',
		type: errorTypes.order,
		userMsg: defaultUserMsg
	},

	/**
		SQL
	**/
	sqlInsertFailed: {
		statusCode: 500,
		errorKey: 'sqlInsertFailed',
		type: errorTypes.db,
		userMsg: defaultUserMsg
	},
	sqlUpdateFailed: {
		statusCode: 500,
		errorKey: 'sqlUpdateFailed',
		type: errorTypes.db,
		userMsg: defaultUserMsg
	},
	resourceAlreadyInactive: {
		statusCode: 409,
		errorKey: 'resourceAlreadyInactive',
		type: errorTypes.db,
		userMsg: defaultUserMsg
	},

	/**
		Logs
	**/
	invalidClientType: {
		statusCode: 404,
		errorKey: 'invalidClientType',
		type: errorTypes.clientSide,
		userMsg: defaultUserMsg
	},


	/**
		Unhandled
	**/
	internalServerError: {
		statusCode: 500,
		errorKey: 'internalServerError',
		type: errorTypes.unhandled,
		userMsg: defaultUserMsg
	}
}

function errorHandler(err, req, res, next) {
	const requester = getRequester(req, res);
	// Log the error to the console
	console.log('[ERR]: ' + err.errorKey);
	// Check that we are handling the error
	if(errors.hasOwnProperty(err.errorKey)) {
		log.error(req.path, err.errorKey, err.type, requester);
		res.status(errors[err.errorKey].statusCode)
		return res.json(err);
	}
	// If the error is not handled, return a general 500
	log.undhandledError(req.path, err, requester);
	res.status(errors.internalServerError.statusCode); 	
	res.json(errors.internalServerError);
}

function getRequester(req, res) {
	if(res.locals.authUser != undefined) return res.locals.authUser.userId;
	if(req.body.email != undefined) return req.body.email;
	if(req.query.email != undefined) return req.query.email;
	return 'undetermined';
}

module.exports.errors = errors;
module.exports.errorTypes = errorTypes;
module.exports.errorHandler = errorHandler;