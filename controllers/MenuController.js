const shortId = require('shortid');
const MenuService = require('../services/MenuService');
const AuthService = require('../services/AuthService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await MenuService.get(req, u);
	if(result.err) return next(result.err);
	return res.status(209).json(result);
}

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await MenuService.create(req, u);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await MenuService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}