const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const roles = require('../entities/UserRolesEntity').roles;
const shortId = require('shortid');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.get = async (menuId) => {
	const menu = await MenuEntity.getMenuDetails(menuId);
	if(menu.err) return { err: menu.err };

	const menuObj = {
		id: menu[0].menuId,
		name: menu[0].name,
		restaurant: {
			id: menu[0].restaurantId,
			name: menu[0].restaurantName
		},
		categories: []
	}

	const categories = await MenuEntity.getMenuCategories(menuId);
	if(categories.err) return { err: categories.err };
	for(const c of categories) {
		const categoryObj = {
			id: c.categoryId,
			name: c.categoryId,
			items: []
		}
		menuObj.categories.push(categoryObj);
	};

	const items = await MenuEntity.getMenuItems(menuId);
	if(items.err) return { err: items.err };

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

module.exports.create = async (params) => {
	const menuObj = {
		menuId: shortId.generate(),
		restaurantId: params.restaurantId,
		name: params.name,
		description: params.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}
	const create = await MenuEntity.createNewMenu(menuObj);
	if(create.err) return { err: create.err };
	return { menuId: menuObj.menuId };	
}

module.exports.update = async (menuId, params) => {
	const menuObj = ParamHelper.buildObjBasedOnParams(params, editableParams);
	const update = Menu.updateMenuDetails(menuId, menuObj);
	if(update.err) return { err: update.err };
	return true;
}