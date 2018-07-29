const ParamHelper = require('../helpers/ParamHelper');
const MenuService = require('../services/MenuService');
const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const editableParams = require('../services/MenuService').editableParams;
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const shortId = require('shortid');

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: [],
		route: ['menuId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}
	
	/* Any diner or admin can access any menu. A restaurateur can access only menus they own */
	if(u.userRole == roles.restaurateur) {
		const ownerId = await MenuEntity.getMenuOwnerId(req.params.menuId);
		if(ownerId.err) return next(ownerId.err);
		if(ownerId.length < 1) return next(e.menuNotFound);

		if(!AuthService.userHasAccessRights(u, ownerId[0].ownerId)) {
			return next(e.insufficientPermissions);
		}
	}

	const result = await MenuService.get(req.params.menuId);
	if(result.err) return next(result.err);
	return res.status(209).json(result);
}

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: ['name', 'restaurantId'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	/* The restaurateur must be the owner of the restaurant to which the new menu will be assigned */
	const restaurant = RestaurantEntity.getRestaurantOwnerId(req.body.restaurantId);
	if(restaurant.err) return next(restaurant.err);
	if(restaurant.length < 1) return next(e.restaurantNotFound);
	if(!AuthService.userHasAccessRights(u, restaurant[0].ownerId)) {
		return next(e.insufficientPermissions);
	}

	const result = await MenuService.create(req.body);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return next(e.missingRequiredParams);

	const menu = await MenuEntity.getMenuOwnerId(req.params.menuId);
	if(menu.err) return next(menu.err);
	if(menu.length < 1) return next(e.menuNotFound);
	if(!AuthService.userHasAccessRights(u, menu[0].ownerId)) {
		return next(e.insufficientPermissions);
	}

	const result = await MenuService.update(req.params.menuId, req.body);
	if(result.err) return next(result.err);
	return res.status(204).end();
}