const router = require('express').Router();
const TableUserEntity = require('../entities/TableUserEntity');
const AuthEntity = require('../entities/AuthEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('/users/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;

	RestaurantEntity.getRestaurantOwnerId(restaurantId)
	.then((r) => {
		if(r.length < 1) throw e.restaurantNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions
		return TableUserEntity.getAllTableUsersForRestaurant(restaurantId);
	}).then((tableUsers) => {
		return res.status(200).json({ data: tableUsers });
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;