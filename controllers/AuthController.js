const AuthService = require('../services/AuthService');
const e = require('../helpers/ErrorHelper').errors;

module.exports.login = async (req, res, next) => {
	const result = await AuthService.login(req);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.dinerLogin = async (req, res, next) => {
	const result = await AuthService.dinerLogin(req);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.logout = async (req, res, next) => {
	const u = res.locals.authUser; /* This is set in the authentication middleware */
	
	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}
	
	const result = await AuthService.logout(req);
	if(result.err) return next(result.err);
	return res.status(200).json();
}