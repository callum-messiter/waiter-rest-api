const router = require('express').Router();
const shortId = require('shortid');
const ItemEntity = require('../entities/ItemEntity');
const CategoryEntity = require('../entities/CategoryEntity');
const AuthEntity = require('../entities/AuthEntity');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('/:itemId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['itemId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	ItemEntity.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return ItemEntity.getItemById(req.params.itemId);

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
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['categoryId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	CategoryEntity.getCategoryOwnerId(req.params.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return ItemEntity.getAllItemsFromCategory(req.params.categoryId);

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
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

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
	CategoryEntity.getCategoryOwnerId(item.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return ItemEntity.createNewItem(item);

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
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.name == undefined && req.body.price == undefined && req.body.description == undefined);
	if(req.params.itemId == undefined || noValidParams) throw e.missingRequiredParams;

	// TODO: Check that the request body contains at least one valid category property
	ItemEntity.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return ItemEntity.updateItemDetails(req.params.itemId, req.body);

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
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['itemId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	ItemEntity.getItemOwnerId(req.params.itemId)
	.then((r) => {

		if(r.length < 1) throw e.itemNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return ItemEntity.deactivateItem(req.params.itemId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;