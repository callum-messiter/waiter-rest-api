const shortId = require('shortid');
const ItemEntity = require('../entities/ItemEntity');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthService = require('../services/AuthService');
const ParamHelper = require('../helpers/ParamHelper');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'price', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.getCategoryItems = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: [],
		route: ['categoryId']
	}
	if(ParamHelper.paramsMissing(zreq, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	const category = await CategoryEntity.getCategoryOwnerId(req.params.categoryId);
	if(category.err) return { err: category.err };
	if(category.length < 1) return { err: e.categoryNotFound };
	if(!AuthService.userHasAccessRights(authUser, category[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const items = await ItemEntity.getAllItemsFromCategory(req.params.categoryId);
	if(items.err) return { err: items.err };
	return res.status(200).json(items); 
}

module.exports.create = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: ['categoryId', 'name', 'price'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	const itemObj = {
		itemId: shortId.generate(),
		categoryId: req.body.categoryId,
		name: req.body.name,
		price: req.body.price,
		description: req.body.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}

	const category = await CategoryEntity.getCategoryOwnerId(itemObj.categoryId);
	if(category.err) return { err: category.err };
	if(category.length < 1 ) return { err: e.categoryNotFound };
	if(!AuthService.userHasAccessRights(authUser, category[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const create = await ItemEntity.createNewItem(itemObj);
	if(create.err) return { err: create.err };
	return res.status(201).json({ itemId: itemObj.itemId });
}

module.exports.update = async (req, authUser) => {
	/* There are no required params, but at least one editable param must be provided */
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return { err: e.missingRequiredParams };

	/* `active` param must be bool */
	if(req.body.active) {
		if(req.body.active !== true && req.body.active !== false) {
			return { err: e.invalidParamValue };
		}
		req.body.active = (req.body.active === true) ? 1 : 0;
	}
	
	const item = await ItemEntity.getItemOwnerId(req.params.itemId);
	if(item.err) return { err: item.err };
	if(item.length < 1) retrun { err: e.itemNotFound };
	if(!AuthService.userHasAccessRights(authUser, item[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}
	
	const itemObj = ParamHelper.buildObjBasedOnParams(req.body, editableParams);
	const update = await ItemEntity.updateItemDetails(req.params.itemId, itemObj);
	if(update.err) return { err: update.err };
	return true;
}