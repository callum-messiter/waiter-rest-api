const AuthService = require('../services/AuthService');
const RestaurantService = require('../services/RestaurantService');
const UserService = require('../services/UserService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.create = async (req, res, next) => {
	const result = await UserService.create(req);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await UserService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}
