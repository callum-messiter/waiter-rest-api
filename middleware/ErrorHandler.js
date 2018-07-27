const errors = require('../helpers/ErrorHelper').errors;
const log = require('../helpers/LogHelper');

const getRequester = (req, res) => {
	if(res.locals.authUser != undefined) return res.locals.authUser.userId;
	if(req.body.email != undefined) return req.body.email;
	if(req.query.email != undefined) return req.query.email;
	return 'undetermined';
}

const checkIfStripeErrorAndHandle = (err, stripeError) => {
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

module.exports = (err, req, res, next) => {
	const requester = getRequester(req, res);
	err = checkIfStripeErrorAndHandle(err, errors.stripeError);
	console.log('[ERR]: ' + err.errorKey);
	
	/* Check that the error is an anticipated one (found in ErrorHelper.js) */
	if(errors.hasOwnProperty(err.errorKey)) {
		log.error(req.path, requester, err);
		res.status(errors[err.errorKey].statusCode)
		return res.json(err);
	}
	/* If the error is unanticipated, return a general 500 */
	log.undhandledError(req.path, err, requester);
	res.status(errors.internalServerError.statusCode); 	
	res.json(errors.internalServerError);
}