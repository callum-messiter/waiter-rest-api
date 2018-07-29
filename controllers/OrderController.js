const OrderService = require('../services/OrderService');
const AuthService = require('../services/AuthService');
const OrderEntity = require('../entities/OrderEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const UserEntity = require('../entities/UserEntity');
const ParamHelper = require('../helpers/ParamHelper');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;;

module.exports.get = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: [],
		route: ['orderId']
	}
	if( ParamHelper.paramsMissing(req, requiredParams) ) {
		return next(e.missingRequiredParams);
	}

	const ownerId = await OrderEntity.getOrderOwnerId(req.params.orderId, u.userRole);
	if(ownerId.err) return next(ownerId.err);
	if(ownerId.length < 1) return next(e.orderNotFound);
	if( !AuthService.userHasAccessRights(u, ownerId[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await OrderService.get(req.params.orderId);
	if(result.err) return next(result.err);
	return res.status(200).json(result);	
}

module.exports.getList = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: ['ownerId'],
		body: [],
		route: []
	}
	if( ParamHelper.paramsMissing(req, requiredParams) ) {
		return next(e.missingRequiredParams);
	}

	/* If requester is diner -> userId. If requester is restaurateur -> restaurantId */
	const ordersOwnerId = req.query.ownerId;
	const liveOnly = (req.query.liveOnly == 'true') ? true : false;

	/* 
		Only admins can access the resources of others.
		Thus: 
			if requester is restaurateur, `ownerId` param must be the ID of a restaurant owned by the requester
			if requester is diner, `ownerId` param must a userId equal the userId of the requester
	*/
	let ownerId, potentialErr;
	if(u.userRole == roles.restaurateur) {

		/* The `ownerId` param is a restaurantId (the requester wants their restaurant's order history) */
		restaurantOwner = await RestaurantEntity.getRestaurantOwnerId(ordersOwnerId);
		if(restaurantOwner.err) return next(restaurantOwner.err);
		if(restaurantOwner.length < 1) return next(e.restaurantNotFound);
		ownerId = restaurantOwner[0].ownerId;

	} else if(u.userRole == roles.diner) {

		/* The `ownerId` param is a userId (the requester (diner) wants their own order history) */
		diner = await UserEntity.getUserById(ordersOwnerId);
		if(diner.err) return next(diner.err);
		if(diner.length < 1) return next(e.userNotFound);
		ownerId = diner[0].userId;

	} else {
		return next(e.internalServerError); /* Should never happen - we already checked roles ^ */
	}

	if( !AuthService.userHasAccessRights(u, ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await OrderService.getList(ordersOwnerId, u.userRole, liveOnly);
	if(result.err) return next(result.err);
	return res.status(200).json(result);
}

module.exports.refund = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: ['orderId'],
		route: []
	}
	if( ParamHelper.paramsMissing(req, requiredParams) ) {
		return next(e.missingRequiredParams);
	}

	const ownerId = await OrderEntity.getOrderOwnerId(req.params.orderId, u.userRole);
	if(ownerId.err) return next(ownerId.err);
	if(ownerId.length < 1) return next(e.orderNotFound);
	if( !AuthService.userHasAccessRights(u, ownerId[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await OrderService.refund(req.params.orderId);
	if(result.err) return next(result.err);
	return res.status(204).end();
}