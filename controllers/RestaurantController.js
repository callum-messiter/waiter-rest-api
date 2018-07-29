const AuthService = require('../services/AuthService');
const RestaurantService = require('../services/RestaurantService');
const RestaurantEntity = require('../entities/RestaurantEntity');
const ParamHelper = require('../helpers/ParamHelper');
const editableParams = require('../services/RestaurantService').editableParams;
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}
	const rid = req.params.restaurantId;

	/* Any diner or admin can access any restaurant. A restaurateur can access only restaurants they own */
	if(u.userRole == roles.restaurateur) {
		const ownerId = await RestaurantEntity.getRestaurantOwnerId(rid);
		if(ownerId.err) return next(ownerId.err);
		if(ownerId.length < 1) return next(e.restaurantNotFound);

		if(!AuthService.userHasAccessRights(u, ownerId[0].ownerId)) {
			return next(e.insufficientPermissions);
		}
	}

	const result = await RestaurantService.get(rid);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.getList = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const result = await RestaurantService.getList();
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.getTableUsers = async (req, res, next) => {
	const u = res.locals.authUser;
	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	const rid = req.params.restaurantId;
	const ownerId = await RestaurantEntity.getRestaurantOwnerId(rid);
	if(ownerId.err) return next(ownerId.err);
	if(ownerId.length < 1 ) return next(e.restaurantNotFound);
	if( !AuthService.userHasAccessRights(u, ownerId[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await RestaurantService.getTableUsers(rid);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const requiredParams = {
		query: [],
		body: ['name', 'ownerId'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	const user = UserEntity.getUserById(req.body.userId);
	if(user.err) return { err: user.err };
	if(user.length < 1) return { err: e.userNotFound };
	if( !AuthService.userHasAccessRights(u, user[0].userId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await RestaurantService.create(req.body);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	};

	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return next(e.missingRequiredParams);
	
	const rid = req.params.restaurantId;	
	const ownerId = RestaurantEntity.getRestaurantOwnerId(rid);
	if(ownerId.err) return next(ownerId.err);
	if(ownerId.length < 1 ) return next(e.restaurantNotFound);
	if( !AuthService.userHasAccessRights(u, ownerId[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await RestaurantService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).end();
}

module.exports.updateStripeAccount = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	const rid = req.body.restaurantId;
	const ownerId = RestaurantEntity.getRestaurantOwnerId(rid);
	if(ownerId.err) return next(ownerId.err);
	if(ownerId.length < 1 ) return next(e.restaurantNotFound);
	if(!AuthService.userHasAccessRights(authUser, ownerId[0].ownerId)) {
		return next(e.insufficientPermissions);
	}

	const result = await RestaurantService.updateStripeAccount(rid, req.body);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}