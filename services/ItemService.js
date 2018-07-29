const shortId = require('shortid');
const ItemEntity = require('../entities/ItemEntity');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthService = require('../services/AuthService');
const ParamHelper = require('../helpers/ParamHelper');
const e = require('../helpers/ErrorHelper').errors;

const editableParams = ['name', 'price', 'description', 'active'];
module.exports.editableParams = editableParams;

module.exports.create = async (params) => {
	const itemObj = {
		itemId: shortId.generate(),
		categoryId: params.categoryId,
		name: params.name,
		price: params.price,
		description: params.description || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}
	const create = await ItemEntity.createNewItem(itemObj);
	if(create.err) return { err: create.err };
	return res.status(201).json({ itemId: itemObj.itemId });
}

module.exports.update = async (itemId, params) => {
	const itemObj = ParamHelper.buildObjBasedOnParams(params, editableParams);
	const update = await ItemEntity.updateItemDetails(itemId, itemObj);
	if(update.err) return { err: update.err };
	return true;
}