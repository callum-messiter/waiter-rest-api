const CategoryService = require('../services/CategoryService');
const AuthService = require('../services/AuthService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const ParamHelper = require('../helpers/ParamHelper');

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await CategoryService.create(req, u);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await CategoryService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}