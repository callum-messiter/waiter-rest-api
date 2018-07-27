const AuthService = require('../services/AuthService');
const RestaurantService = require('../services/RestaurantService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.get(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.getList = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.getList(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.getTableUsers = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.getTableUsers(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.create(req, u);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}