const router = require('express').Router();
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

/* Move to Category */
module.exports.getItems = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await ItemService.getCategoryItems(req, u);
	if(result.err) return next(result.err);
	return res.status(209).json(result);
}

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await ItemService.create(req, u);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await ItemService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}