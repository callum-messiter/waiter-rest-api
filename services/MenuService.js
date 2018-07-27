const ParamHelper = require('../helpers/ParamHelper');
const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const roles = require('../entities/UserRolesEntity').roles;
const shortId = require('shortid');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.get = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: [],
		route: ['menuId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}
	
	/* Any diner or admin can access any menu. A restaurateur can access only menus they own */
	if(authUser.userRole == roles.restaurateur) {
		const ownerId = await MenuEntity.getMenuOwnerId(req.params.menuId);
		if(ownerId.err) return { err: ownerId.err };
		if(ownerId.length < 1) return { err: e.menuNotFound };

		if(!AuthService.userHasAccessRights(authUser, ownerId[0].ownerId)) {
			return { err: e.insufficientPermissions };
		}
	}

	const menu = await MenuEntity.getMenuDetails(req.params.menuId);
	if(menu.err) return { err: menu.err };

	const categories = await MenuEntity.getMenuCategories(req.params.menuId);
	if(categories.err) return { err: categories.err };
	for(const c of categories) { c.items = [] };

	const items = await MenuEntity.getMenuItems(req.params.menuId);
	if(items.err) return { err: items.err };

	const menuObj = {
		id: menu[0].menuId,
		name: menu[0].name,
		restaurant: {
			id: menu[0].restaurantId,
			name: menu[0].restaurantName
		},
		categories: categories
	}

	for(const i of items) {
		/* Check if the item belongs to any of the categories */
		for(const c of menuObj.categories) {
			if(c.categoryId == i.categoryId) {
				const itemObj = {
					id: i.itemId,
					name: i.name,
					price: i.price,
					description: i.description
				}
				c.items.push(itemObj);
			}
		}
	}
	return menuObj;
}

module.exports.create = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: ['name', 'restaurantId'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		throw e.missingRequiredParams;
	}

	const menuObj = {
		menuId: shortId.generate(),
		restaurantId: req.body.restaurantId,
		name: req.body.name,
		description: req.body.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}

	/* The restaurateur must be the owner of the restaurant to which the new menu will be assigned */
	const restaurant = RestaurantEntity.getRestaurantOwnerId(menuObj.restaurantId);
	if(restaurant.err) return { err: restaurant.err };
	if(restaurant.length < 1) return { err: e.restaurantNotFound };
	if(!AuthService.userHasAccessRights(u, restaurant[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const create = await MenuEntity.createNewMenu(menuObj);
	if(create.err) return { err: create.err };
	return { menuId: menuObj.menuId };	
}

module.exports.update = async (req, authUser) => {
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return { err: e.missingRequiredParams };

	const menu = await MenuEntity.getMenuOwnerId(req.params.menuId);
	if(menu.err) return { err: menu.err };
	if(menu.length < 1) return { err: e.menuNotFound };
	if(!AuthService.userHasAccessRights(authUser, menu[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const menuObj = ParamHelper.buildObjBasedOnParams(req.body, editableParams);
	const update = Menu.updateMenuDetails(req.params.menuId, menuObj);
	if(update.err) return { err: update.err };
	return true;
}