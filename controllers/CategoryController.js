const router = require('express').Router();
const shortId = require('shortid');
const Category = require('../models/Category');
const Auth = require('../models/Auth');
const Menu = require('../models/Menu');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['menuId', 'name'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const category = req.body;
	category.categoryId = shortId.generate();

	Menu.getMenuOwnerId(category.menuId)
	.then((r) => {

		if(r.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Category.createNewCategory(category);

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

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.name == undefined && req.body.description == undefined);
	if(req.params.categoryId == undefined || noValidParams) throw e.missingRequiredParams;

	Category.getCategoryOwnerId(req.params.categoryId)
	.then((r) => {

		if(r.length < 1) throw e.categoryNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Category.updateCategoryDetails(req.params.categoryId, req.body);

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
		return Category.deactivateCategory(req.params.categoryId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({})
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;