const shortId = require('shortid');
const moment = require('moment');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const ParamHelper = require('../helpers/ParamHelper');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'price', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.create = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: ['menuId', 'name'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

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
	if(!AuthService.userHasAccessRights(authUser, menu[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}
	
	const category = await CategoryEntity.createNewCategory(categoryObj);
	if(category.err) return { err: category.err };
	return { categoryId: categoryObj.categoryId }
}

module.exports.update = async (req, authUser) => {
	/* There are no required params, but at least one editable param must be provided */
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return { err: e.missingRequiredParams };

	const category = await CategoryEntity.getCategoryOwnerId(req.params.categoryId);
	if(category.err) return { err: category.err };
	if(category.length < 1) return { err: e.categoryNotFound };
	if(!AuthService.userHasAccessRights(authUser, category[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}
	
	const categoryObj = ParamHelper.buildObjBasedOnParams(req.body, editableParams);
	const update = await CategoryEntity.updateCategory(req.params.categoryId, categoryObj);
	if(update.err) return { err: update.err };
	return true;
}