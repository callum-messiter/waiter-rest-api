// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Restaurants = require('../models/Restaurants');
const Menus = require('../models/Menus');
const Auth = require('../models/Auth');
const Users = require('../models/Users');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const e = require('../helpers/error').errors;

// TODO: condense queries 'getAllRestaurants', 'getAllMenus' into one; remove slash from route
router.get('/', (req, res, next) => {
	const u = res.locals.authUser;

	// TODO: roles allowed
	Restaurants.getAllRestaurants()
	.then((restaurants) => {

		res.locals.restaurants = restaurants;
		// Add to each restaurant object a menus array, to be populated in the next block
		for(var i = 0; i < restaurants.length; i++) {
			restaurants[i].menus = [];
		}
		return Menus.getAllMenus();

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

/**
	Get a restaurant and its details
**/
router.get('/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.restaurantId == undefined) throw e.missingRequiredParams;
	const restaurantId = req.params.restaurantId;

	Restaurants.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurants.getRestaurantById(restaurantId);

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

	if(req.body.name == undefined || req.body.description == undefined) throw e.missingRequiredParams;

	const restaurant = req.body;
	restaurant.restaurantId= shortId.generate(); // Assign ID
	restaurant.ownerId = u.userId; // Assign ownerId
	res.locals.restaurant = restaurant;

	// First check that the user exists
	Users.getUserById(u.userId)
	.then((u) => {

		if(u.length < 1) throw e.userNotFound;
		Restaurants.createNewRestaurant(restaurant);

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

	const noValidParams = (req.body.name == undefined && req.body.description == undefined);
	if(req.params.restaurantId == undefined || noValidParams) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;
	const restaurantData = req.body;

	Restaurants.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		Restaurants.updateRestaurantDetails(restaurantId, restaurantData);

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

	if(req.params.restaurantId == undefined) throw e.missingRequiredParams;
	const restaurantId = req.params.restaurantId;

	Restaurants.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurants.deactivateRestaurant(restaurantId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;