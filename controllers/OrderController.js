const OrderService = require('../services/OrderService');
const AuthService = require('../services/AuthService');
const ParamHelper = require('../helpers/ParamHelper');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;;

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await OrderService.get(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);	
}

module.exports.getList = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await OrderService.getList(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.refund = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const result = await OrderService.refund(req, u);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}