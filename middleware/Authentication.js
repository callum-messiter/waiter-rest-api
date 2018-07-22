const AuthEntity = require('../entities/AuthEntity');
const e = require('../helpers/error').errors;

const freeRoutes = [
	'/auth/login', 
	'/auth/login/d', 
	'/user/create', 
	'/user/r', 
	'/user/d'
];

module.exports = async function(req, res, next) {
	if(freeRoutes.includes(req.path)) return next();
	if(req.headers.authorization === undefined) return next(e.missingRequiredHeaders);

	const payload = await AuthEntity.verifyToken(req.headers.authorization);
	if(payload.err) return next(payload.err);

	res.locals.authUser = payload; /* Decoded payload returned by jwt.verify */
	return next();
}