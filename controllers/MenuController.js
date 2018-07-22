const router = require('express').Router();
const shortId = require('shortid');
const MenuEntity = require('../entities/MenuEntity');
const AuthEntity = require('../entities/AuthEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

// TODO: condense queries 'getMenuDetails', 'getMenuCategories', 'getMenuItems' into one (or two) queries
router.get('/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['menuId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const menuId = req.params.menuId;
	MenuEntity.getMenuOwnerId(menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		// A menu can be retrieved by any user
		// if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return MenuEntity.getMenuDetails(menuId);

	}).then((m) => {

		// Set menu details
		res.locals.menu = {
			restaurantId: m[0].restaurantId,
			restaurantName: m[0].restaurantName,
			menuId: m[0].menuId,
			menuName: m[0].name,
			categories: []
		};
		return MenuEntity.getMenuCategories(menuId);

	}).then((c) => {

		const m = res.locals.menu;
		m.categories = c; // Add the categories to the menu
		// Add to each category object an empty items array; populated in this next block
		for(i = 0; i < m.categories.length; i++) {
			m.categories[i].items = [];
		}
		return MenuEntity.getMenuItems(menuId);
		
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

router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['name', 'restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const menu = req.body;
	menu.menuId = shortId.generate();
	const restaurantId = req.body.restaurantId;

	RestaurantEntity.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return MenuEntity.createNewMenu(menu);

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
router.put('/update/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (
		req.body.name == undefined && req.body.daysOpen == undefined && 
		req.body.openingTime == undefined && req.body.closingTime == undefined
	);
	if(req.params.menuId == undefined || noValidParams) throw e.missingRequiredParams;

	MenuEntity.getMenuOwnerId(req.params.menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Menu.updateMenuDetails(req.params.menuId, req.body);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:menuId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['menuId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	MenuEntity.getMenuOwnerId(req.params.menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return MenuEntity.deactivateMenu(req.params.menuId);

	}).then((result) => {
		// TODO; change to 204
		res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;