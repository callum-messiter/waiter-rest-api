// Helpers
const e = require('../helpers/error').errors;
// Models
const Auth = require('../models/Auth');
const Api = require('./api');

module.exports.authoriseUser = function(req, res, next) {
	// We will authorise the user on all routes except for those specified here
	if(req.path == '/auth/login' || 
		req.path == '/auth/login/d' || 
		req.path == '/auth/login/r' || 
		req.path == '/user/create' ||
		req.path == '/user/r' ||
		req.path == '/user/d'
	) {
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

module.exports.checkRequestParams = function(req, res, next) {
	// Set the requestParams depending on the route
	// setRequiredParamsForRoute(req.path, res);

	const queryParams = requiredParams.query;
	for(var i = 0; i < queryParams.length; i++) { if(req.query[queryParams[i]] == undefined) return next(e.missingRequiredParams); }
	
	const bodyParams = requiredParams.body;
	for(var i = 0; i < bodyParams.length; i++) { if(req.body[bodyParams[i]] == undefined) return next(e.missingRequiredParams); }
	
	const routeParams = requiredParams.route;
	for(var i = 0; i < routeParams.length; i++) { if(req.params[routeParams[i]] == undefined) return next(e.missingRequiredParams); }
	
	return next();
}

function setRequiredParamsForRoute(reqPath, res) {
	// Loop through all routes, and if the path == reqPath, get the requiredParams obj and set res.locals.requiredParams = requiredParams
}

// MAKING checkRequestParams middlware

/**
	router.use(mw.checkRequestParams);
	
	// Break routes into files per resource (user, menu etc.)
	const userRoutes = {
		create: {
			path: '/user/create',
			requiredParams: {
				query: [],
				body: ['email', 'password', 'firstName', 'lastName', 'userType', 'restaurantName'],
				route: []
			}
		},
		get: ...,
		update: ...,
		deactivate: ...
	}

	// New way of defining path and controller
	router.use(userRoutes.create.path, UserController.create);
	
	// The middleware function will need to check EVERY route object. So we will need to export each 
	// one into a large routes object in another file, and then loop through it in the middleware function
**/

/**


**/