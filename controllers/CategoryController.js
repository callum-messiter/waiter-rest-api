// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
// Helpers
const e = require('../helpers/error').errors;

// TODO: add getCategory

router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.body.name == undefined || req.body.menuId == undefined) throw e.missingRequiredParams;
	const category = req.body;
	category.categoryId = shortId.generate();

	Menus.getMenuOwnerId(category.menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Categories.createNewCategory(category);

	}).then((result) => {
		// TODO: change to 201
		return res.status(201).json( data = {createdCategoryId: category.categoryId} );
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/update/:categoryId', (req, res, next) => {
	const u = res.locals.authUser;

	// At least one of the editable params must be provided
	const noValidParams = (req.body.name == undefined && req.body.description == undefined);
	if(req.params.categoryId == undefined || noValidParams) throw e.missingRequiredParams;

	const categoryId = req.params.categoryId;
	const categoryData = req.body;
	// TODO: Check that the request body contains at least one valid category property
	Categories.getCategoryOwnerId(categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Categories.updateCategoryDetails(categoryId, categoryData);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:categoryId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.categoryId == undefined) throw e.missingRequiredParams;
	const categoryId = req.params.categoryId;

	Categories.getCategoryOwnerId(categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Categories.deactivateCategory(categoryId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({})
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;