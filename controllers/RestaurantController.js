const router = require('express').Router();
const shortId = require('shortid');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Auth = require('../models/Auth');
const User = require('../models/User');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

// TODO: condense queries 'getAllRestaurants', 'getAllMenus' into one; remove slash from route
router.get('/', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// TODO: roles allowed
	Restaurant.getAllRestaurants()
	.then((restaurants) => {

		res.locals.restaurants = JSON.parse(JSON.stringify(restaurants));
		// Add to each restaurant object a menus array, to be populated in the next block
		for(var i = 0; i < res.locals.restaurants.length; i++) {
			res.locals.restaurants[i].menus = [];
		}
		return Menu.getAllMenus();

	}).then((menus) => {

		res.locals.restaurants.forEach((r) => {
			// If the menu belongs to the restaurant, add it to the menus array
			menus.forEach((m) => {
				if(r.restaurantId == m.restaurantId) {
					r.menus.push({
						menuId: m.menuId,
						name: m.name
					});
				}
			});
		});
		return res.status(200).json( {data: res.locals.restaurants} );

	}).catch((err) => {
		return next(err);
	});
});

router.get('/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
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
		// A menu restaurant's details can be retrieved by any user
		// if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.getRestaurantById(restaurantId);

	}).then((r) => {

		// There may be multiple restaurants owned by a single user; for now, get the first restuarant returned
		return res.status(200).json({
			data: {
				name: r[0].name,
				description: r[0].description,
				location: r[0].location,
				phoneNumber: r[0].phoneNumber,
				emailAddress: r[0].emailAddress
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

// TODO: remove route param 'userId'; create restaurant for authUser.userId
router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['name', 'description'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurant = req.body;
	restaurant.restaurantId= shortId.generate(); // Assign ID
	restaurant.ownerId = u.userId; // Assign ownerId
	res.locals.restaurant = restaurant;

	// First check that the user exists
	User.getUserById(u.userId)
	.then((u) => {

		if(u.length < 1) throw e.userNotFound;
		return Restaurant.createNewRestaurant(restaurant);

	}).then((result) => {
		// TODO: change to 201; remove parent obj 'data'
		return res.status(200).json( {
			data: {
				createdRestaurantId: res.locals.restaurant.restaurantId
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/update/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.name == undefined && req.body.description == undefined);
	if(req.params.restaurantId == undefined || noValidParams) throw e.missingRequiredParams;
	
	const restaurantId = req.params.restaurantId;
	const restaurantData = req.body;
	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.updateRestaurantDetails(restaurantId, restaurantData);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:restaurantId', (req, res, next) => {
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
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.deactivateRestaurant(restaurantId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;