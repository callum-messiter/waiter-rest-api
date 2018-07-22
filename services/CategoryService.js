const shortId = require('shortid');
const moment = require('moment');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const e = require('../helpers/error').errors;

module.exports.create = async (req, authUser) => {
	const categoryObj = {
		categoryId: shortId.generate(),
		menuId: req.body.menuId,
		name: req.body.name,
		description: req.body.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}

	const menu = await MenuEntity.getMenuOwnerId(categoryObj.menuId);
	if(menu.err) return { err: menu.err };
	if(menu.length < 1) return { err: e.menuNotFound };
	if(!AuthService.userHasAccessRights(authUser, menu[0].ownerId)) return { err: e.insufficientPermissions };
	
	const category = await CategoryEntity.createNewCategory(categoryObj);
	if(category.err) return { err: category.err };
	return { categoryId: categoryObj.categoryId }
}

module.exports.update = async (req, authUser) => {
	const category = await CategoryEntity.getCategoryOwnerId(req.params.categoryId);
	if(category.err) return { err: category.err };
	if(category.length < 1) return { err: e.categoryNotFound };
	if(!AuthService.userHasAccessRights(authUser, category[0].ownerId)) return { err: e.insufficientPermissions };

	/* Add any valid params to the category object */
	const editableParams = ['name', 'description', 'active'];
	let categoryObj = {};
	for(const p of editableParams) {
		if(req.body[p]) {
			categoryObj[p] = req.body[p];
		}
	}

	const update = await CategoryEntity.updateCategory(req.params.categoryId, categoryObj);
	if(update.err) return { err: update.err };
	return true;
}