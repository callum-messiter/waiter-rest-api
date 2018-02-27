const router = require('express').Router();
const shortId = require('shortid');
const Item = require('../models/Item');
const Category = require('../models/Category');
const Auth = require('../models/Auth');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('/:itemId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['itemId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Item.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Item.getItemById(req.params.itemId);

	}).then((i) => {
		// TODO: remove parent obj 'data'
		res.status(200).json({data: i});
	}).catch((err) => {
		return next(err);
	})
});

// TODO: move this to CategoryController; route: /:categoryId/items
router.get('/fromCategory/:categoryId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['categoryId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Category.getCategoryOwnerId(req.params.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Item.getAllItemsFromCategory(req.params.categoryId);

	}).then((i) => {
		// TODO: remove parent obj 'data'
		return res.status(200).json( {data: i} ); 
	}).catch((err) => {
		return next(err);
	});
});

router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['name', 'price', 'description'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	if(req.body.name == undefined || req.body.price == undefined || req.body.categoryId == undefined) {
		throw e.missingRequiredParams;
	}
	const item = req.body;
	item.itemId = shortId.generate();

	// TODO: check user has the correct role
	Category.getCategoryOwnerId(item.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Item.createNewItem(item);

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

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.name == undefined && req.body.price == undefined && req.body.description == undefined);
	if(req.params.itemId == undefined || noValidParams) throw e.missingRequiredParams;

	// TODO: Check that the request body contains at least one valid category property
	Item.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Item.updateItemDetails(req.params.itemId, req.body);

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

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['itemId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Item.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Item.deactivateItem(req.params.itemId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;