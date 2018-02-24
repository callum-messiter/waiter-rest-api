// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Items = require('../models/Items');
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
const e = require('../helpers/error').errors;

/**
	Create a new item, assigned to a category
**/
router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.body.name == undefined || req.body.price == undefined || req.body.categoryId == undefined) {
		throw e.missingRequiredParams;
	}
	const item = req.body;
	item.itemId = shortId.generate();

	// TODO: check user has the correct role
	Categories.getCategoryOwnerId(item.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Items.createNewItem(item);

	}).then((result) => {
		// TODO: remove parent obj 'data'
		return res.status(201).json( {data: {createdItemId: item.itemId}} );
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/update/:itemId', (req, res, next) => {
	const u = res.locals.authUser;

	// At least one of the editable params must be provided
	const noValidParams = (req.body.name == undefined && 
						   req.body.price == undefined && 
						   req.body.description == undefined);
	if(req.params.itemId == undefined || noValidParams) throw e.missingRequiredParams;

	const itemId = req.params.itemId;
	const itemData = req.body;

	// TODO: Check that the request body contains at least one valid category property
	Items.getItemOwnerId(itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Items.updateItemDetails(itemId, itemData);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:itemId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.itemId == undefined) throw e.missingRequiredParams;
	const itemId = req.params.itemId;

	Items.getItemOwnerId(itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Items.deactivateItem(itemId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: move this to CategoryController; route: /:categoryId/items
router.get('/fromCategory/:categoryId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.categoryId == undefined) throw e.missingRequiredParams;
	const categoryId = req.params.categoryId;

	Categories.getCategoryOwnerId(categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Items.getAllItemsFromCategory(categoryId);

	}).then((i) => {
		// TODO: remove parent obj 'data'
		return res.status(200).json( {data: i} ); 
	}).catch((err) => {
		return next(err);
	});
});

/**
	Get a single item by referencing its ID
**/
router.get('/:itemId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.itemId == undefined) throw e.missingRequiredParams;
	Items.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Items.getItemById(req.params.itemId);

	}).then((i) => {
		// TODO: remove parent obj 'data'
		res.status(200).json({data: i});
	}).catch((err) => {
		return next(err);
	})
});

module.exports = router;