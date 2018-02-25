// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Menus = require('../models/Menus');
const Auth = require('../models/Auth');
const UserRoles = require('../models/UserRoles');
const Restaurants = require('../models/Restaurants');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const QueryHelper = require('../helpers/QueryHelper');
const e = require('../helpers/error').errors;

// TODO: condense queries 'getMenuDetails', 'getMenuCategories', 'getMenuItems' into one (or two) queries
router.get('/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.menuId == undefined) throw e.missingRequiredParams;
	const menuId = req.params.menuId;
	Menus.getMenuOwnerId(menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Menus.getMenuDetails(menuId);

	}).then((m) => {

		// Set menu details
		res.locals.menu = {
			restaurantId: m[0].restaurantId,
			restaurantName: m[0].restaurantName,
			menuId: m[0].menuId,
			menuName: m[0].name,
			categories: []
		};
		return Menus.getMenuCategories(menuId);

	}).then((c) => {

		const m = res.locals.menu;
		m.categories = c; // Add the categories to the menu
		// Add to each category object an empty items array; populated in this next block
		for(i = 0; i < m.categories.length; i++) {
			m.categories[i].items = [];
		}
		return Menus.getMenuItems(menuId);
		
	}).then((i) => {

		// Add the items to their respective categories
		i.forEach(function(item) {
			const categoryId = item.categoryId;
			const categories = res.locals.menu.categories;
			categories.forEach(function(category) {
				// If the item from the query has the same categoryId as the category...
				if(category.categoryId == categoryId) {
					// ...add the item to this category
					category.items.push({
						itemId: item.itemId,
						name: item.name,
						price: item.price,
						description: item.description
					});
				}
			});
		});
		res.status(200).json( {data: res.locals.menu} );

	}).catch((err) => {
		return next(err);
	});
});

/**
	Create a new menu, assigned to a restaurant 
**/
router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.body.name == undefined || req.body.restaurantId == undefined) throw e.missingRequiredParams;
	const menu = req.body;
	menu.menuId = shortId.generate();
	const restaurantId = req.body.restaurantId;

	Restaurants.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Menus.createNewMenu(menu);

	}).then((result) => {

		// TODO: remove parent obj 'data'
		return res.status(200).json({
			data: {
				createdMenu: {
					menuId: menu.menuId,
					menuName: menu.name
				}
			}
		});

	}).catch((err) => {
		return next(err);
	});
});


// TODO: change to PATCH
router.put('/deactivate/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.menuId == undefined) throw e.missingRequiredParams;
	const menuId = req.params.menuId;

	Menus.getMenuOwnerId(menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Menus.deactivateMenu(menuId);

	}).then((result) => {
		// TODO; change to 204
		res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/update/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	// At least one of the editable params must be provided
	const noValidParams = (req.body.name == undefined);
	if(req.params.menuId == undefined || noValidParams) throw e.missingRequiredParams;

	const menuId = req.params.menuId;
	const menuData = req.body;

	Menus.getMenuOwnerId(menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Menus.updateMenuDetails(menuId, menuData);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;