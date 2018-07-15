const log = require('./logger');
const devErrors = require('./developerErrors');

const errorTypes = {
	auth: '_auth',
	db:'_db',
	item: '_item',
	category: '_category',
	menu: '_menu',
	restaurant: '_restaurant',
	user: '_user',
	order: '_order',
	payment: '_payment',
	liveKitchen: '_liveKitchen',
	clientSide: '_clientSide',
	stripe: '_stripe',
	unhandled: '_unhandled'
}

// Default error message for client to render to user
const defaultUserMsg = 'The waiter system experienced an error - please try again. If the issue persists, contact our support team.';
const defaultDevMsg = 'Check the docs for more info: https://api.waitr.live';
const serverErrDevMsg = 'Check the server logs for more info.';
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
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	missingRequiredParams: {
		statusCode: 400,
		errorKey: 'missingRequiredParams',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	jwtMalformed: {
		statusCode: 401,
		errorKey: 'jwtMalformed',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: 'Oops! Your session has expired. Log in to continue using waitr.'
	},
	insufficientRolePrivileges: {
		statusCode: 403,
		errorKey: 'insufficientRolePrivileges',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	insufficientPermissions: {
		statusCode: 403,
		errorKey: 'insufficientPermissions',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	emailNotRegistered: {
		statusCode: 401,
		errorKey: 'emailNotRegistered',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	passwordIncorrect: {
		statusCode: 401,
		errorKey: 'passwordIncorrect',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	userNotActive: {
		statusCode: 401,
		errorKey: 'userNotActive',
		type: errorTypes.auth,
		devMsg: defaultDevMsg,
		userMsg: 'This account is not currently active. You can restore your account by clicking here.'
	},

	/**
		Users
	**/
	userNotFound: {
		statusCode: 404,
		errorKey: 'userNotFound',
		type: errorTypes.user,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	emailAlreadyRegistered: {
		statusCode: 404,
		errorKey: 'emailAlreadyRegistered',
		type: errorTypes.user,
		devMsg: defaultDevMsg,
		userMsg: 'That email address is already registered to an account! If you\'ve forgotten your password, contact support.'
	},
	currentPasswordIncorrect: {
		statusCode: 401,
		errorKey: 'currentPasswordIncorrect',
		type: errorTypes.user,
		devMsg: defaultDevMsg,
		userMsg: 'Incorrect password. Please double-check and try again.'
	},
	userAlreadyVerified: {
		statusCode: 409,
		errorKey: 'userAlreadyVerified',
		type: errorTypes.user,
		devMsg: defaultDevMsg,
		userMsg: 'Your account is already verified. Go ahead and log in.'
	},
	alreadyCurrentEmail: {
		statusCode: 409,
		errorKey: 'alreadyCurrentEmail',
		type: errorTypes.user,
		devMsg: defaultDevMsg,
		userMsg: 'That email address is already registered to your account. Go ahead and log in.'
	},

	/**
		Restaurants
	**/
	restaurantNotFound: {
		statusCode: 404,
		errorKey: 'restaurantNotFound',
		type: errorTypes.restaurant,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	restaurantDetailsNotFound: {
		statusCode: 404,
		errorKey: 'restaurantDetailsNotFound',
		type: errorTypes.restaurant,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	malformedRestaurantDetails: {
		statusCode: 500,
		errorKey: 'malformedRestaurantDetails',
		type: errorTypes.restaurant,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},
	multipleStripeAccountsForbidden: {
		statusCode: 409,
		errorKey: 'multipleStripeAccountsForbidden',
		type: errorTypes.restaurant,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Menus
	**/
	menuNotFound: {
		statusCode: 404,
		errorKey: 'menuNotFound',
		type: errorTypes.menu,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Categories
	**/
	categoryNotFound: {
		statusCode: 404,
		errorKey: 'categoryNotFound',
		type: errorTypes.category,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Items
	**/
	itemNotFound: {
		statusCode: 404,
		errorKey: 'itemNotFound',
		type: errorTypes.item,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Orders
	**/
	orderNotFound: {
		statusCode: 404,
		errorKey: 'orderNotFound',
		type: errorTypes.order,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Payments
	**/
	chargeNotFound: {
		statusCode: 404,
		errorKey: 'chargeNotFound',
		type: errorTypes.payment,
		devMsg: devErrors.chargeNotFound,
		userMsg: defaultUserMsg
	},

	cannotRefundUnpaidOrder: {
		statusCode: 401,
		errorKey: 'cannotRefundUnpaidOrder',
		type: errorTypes.payment,
		devMsg: devErrors.cannotRefundUnpaidOrder,
		userMsg: defaultUserMsg
	},

	/**
		SQL
	**/
	sqlInsertFailed: {
		statusCode: 500,
		errorKey: 'sqlInsertFailed',
		type: errorTypes.db,
		devMsg: serverErrDevMsg,
		userMsg: defaultUserMsg
	},
	sqlUpdateFailed: {
		statusCode: 500,
		errorKey: 'sqlUpdateFailed',
		type: errorTypes.db,
		devMsg: serverErrDevMsg,
		userMsg: defaultUserMsg
	},
	resourceAlreadyInactive: {
		statusCode: 409,
		errorKey: 'resourceAlreadyInactive',
		type: errorTypes.db,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Logs
	**/
	invalidClientType: {
		statusCode: 404,
		errorKey: 'invalidClientType',
		type: errorTypes.clientSide,
		devMsg: defaultDevMsg,
		userMsg: defaultUserMsg
	},

	/**
		Stripe
	**/
	stripeError: {
		statusCode: '',
		errorKey: 'stripeError',
		type: errorTypes.stripe,
		devMsg: defaultDevMsg,
		userMsg: ''
	},


	/**
		Unhandled
	**/
	internalServerError: {
		statusCode: 500,
		errorKey: 'internalServerError',
		type: errorTypes.unhandled,
		devMsg: serverErrDevMsg,
		userMsg: defaultUserMsg
	}
}

function errorHandler(err, req, res, next) {
	const requester = getRequester(req, res);
	err = checkIfStripeErrorAndHandle(err, errors.stripeError);
	console.log('[ERR]: ' + err.errorKey);
	
	// Check that we are handling the error
	if(errors.hasOwnProperty(err.errorKey)) {
		log.error(req.path, requester, err);
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

function checkIfStripeErrorAndHandle(err, stripeError) {
	if(!err.hasOwnProperty('type')) return err;
	switch (err.type) {
		case 'StripeCardError':
		case 'StripeInvalidRequestError':
			stripeError.userMsg = err.message;
			stripeError.statusCode = 400;
			return stripeError;
		case 'RateLimitError':
		case 'StripeAPIError':
		case 'StripeConnectionError':
		case 'StripeAuthenticationError':
			stripeError.userMsg = defaultUserMsg;
			stripeError.statusCode = 500;
			return stripeError;
		default:
			return err;
	}
}

module.exports.defaultUserMsg = defaultUserMsg;
module.exports.errors = errors;
module.exports.errorTypes = errorTypes;
module.exports.errorHandler = errorHandler;