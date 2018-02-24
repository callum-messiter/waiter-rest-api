// Helpers
const e = require('../helpers/error').errors;
// Models
const Auth = require('../models/Auth');

module.exports.authoriseUser = function(req, res, next) {
	// We will authorise the user on all routes except for those specified here
	if(req.path == '/auth/login' || req.path == '/auth/login/d' || req.path == '/user/create')  {
		return next();
	}
	// Check that the auth header is provided
	if(req.headers.authorization == undefined) return next(e.missingRequiredHeaders);
	// Verify the token
	Auth.verifyToken(req.headers.authorization)
	.then((decodedPayload) => {
		// Add the token to the response-local var, so we can access it in the controllers
		res.locals.authUser = decodedPayload;
		return next();
	}).catch((err) => {
		console.log(err);
		return next(err);
	});
}