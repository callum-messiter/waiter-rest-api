const AuthService = require('../services/AuthService');
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

module.exports.login = async (req, res, next) => {
	const requiredParams = {
		query: ['email', 'password'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) return next(e.missingRequiredParams);

	const result = await AuthService.login(req);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.dinerLogin = async (req, res, next) => {
	const requiredParams = {
		query: ['email', 'password'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) return next(e.missingRequiredParams);

	const result = await AuthService.dinerLogin(req);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.logout = async (req, res, next) => {
	const u = res.locals.authUser; /* This is set in the authentication middleware */
	
	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) return next(e.insufficientRolePrivileges);

	const requiredParams = {
		query: ['userId'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) return next(e.missingRequiredParams);
	
	const result = await AuthService.logout(req);
	if(result.err) return next(result.err);
	return res.status(200).json();
}