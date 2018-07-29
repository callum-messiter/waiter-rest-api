const AuthService = require('../services/AuthService');
const RestaurantService = require('../services/RestaurantService');
const UserService = require('../services/UserService');
const UserEntity = require('../entities/UserEntity');
const ParamHelper = require('../helpers/ParamHelper');
const editableParams = require('../services/UserService').editableParams;
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.create = async (req, res, next) => {
	if(req.body.type === undefined) return next(e.missingRequiredParams);
	
	let requiredBodyParams;
	if(req.body.type == 'diner') {
		requiredBodyParams = ['email', 'password', 'firstName', 'lastName'];
	} else if(req.body.type == 'restaurateur') {
		requiredBodyParams = ['email', 'password', 'firstName', 'lastName', 'restaurantName'];
	} else {
		return next(e.invalidUserType);
	}

	const requiredParams = {
		query: [],
		body: requiredBodyParams,
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	const result = await UserService.create(req);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if( !AuthService.userHasRequiredRole(u.userRole, allowedRoles) ) {
		return next(e.insufficientRolePrivileges);
	}

	const uid = req.params.userId;
	const user = await UserEntity.getUserById(uid);
	if(user.err) return next(user.err);
	if(user.length < 1) return next(e.userNotFound);
	/* Non-admin users can update only their own details; admins can do any */
	if( !AuthService.userHasAccessRights(authUser, uid) ) {
		return next(e.insufficientPermissions);
	}

	const result = await UserService.update(user[0], req.body);
	if(result.err) return next(result.err);
	return res.status(204).end();
}
