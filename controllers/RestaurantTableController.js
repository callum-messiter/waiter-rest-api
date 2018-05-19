const router = require('express').Router();
const TableUser = require('../models/TableUser');
const Auth = require('../models/Auth');
const Restaurant = require('../models/Restaurant');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('/users/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;

	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {
		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions
		return TableUser.getAllTableUsersForRestaurant(restaurantId);
	}).then((tableUsers) => {
		return res.status(200).json({ data: tableUsers });
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;