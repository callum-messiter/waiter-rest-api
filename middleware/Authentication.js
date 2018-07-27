const AuthEntity = require('../entities/AuthEntity');
const e = require('../helpers/ErrorHelper').errors;

/*
	In any route which uses this middleware, it will run before passing control to the relevant controller.
	E.g. creating a new category has the flow:

	PUT /category -> AuthenticationMiddleware (below) -> CategoryController

*/
module.exports = async function(req, res, next) {
	if(req.headers.authorization === undefined) return next(e.missingRequiredHeaders);

	const payload = await AuthEntity.verifyToken(req.headers.authorization);
	if(payload.err) return next(payload.err);

	res.locals.authUser = payload; /* Decoded payload returned by jwt.verify */
	return next();
}