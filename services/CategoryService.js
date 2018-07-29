const shortId = require('shortid');
const moment = require('moment');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthService = require('../services/AuthService');
const MenuEntity = require('../entities/MenuEntity');
const ParamHelper = require('../helpers/ParamHelper');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.create = async (params) => {
	const categoryObj = {
		categoryId: shortId.generate(),
		menuId: params.menuId,
		name: params.name,
		description: params.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}
	const category = await CategoryEntity.createNewCategory(categoryObj);
	if(category.err) return { err: category.err };
	return { categoryId: categoryObj.categoryId }
}

module.exports.update = async (categoryId, params) => {
	const categoryObj = ParamHelper.buildObjBasedOnParams(params, editableParams);
	const update = await CategoryEntity.updateCategory(categoryId, categoryObj);
	if(update.err) return { err: update.err };
	return true;
}