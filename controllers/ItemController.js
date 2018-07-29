const ParamHelper = require('../helpers/ParamHelper');
const CategoryEntity = require('../entities/CategoryEntity');
const ItemEntity = require('../entities/ItemEntity');
const editableParams = require('../services/ItemService').editableParams;
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: ['categoryId', 'name', 'price'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	const category = await CategoryEntity.getCategoryOwnerId(req.body.categoryId);
	if(category.err) return next(category.err);
	if(category.length < 1 ) return next(e.categoryNotFound);
	if(!AuthService.userHasAccessRights(u, category[0].ownerId)) {
		return next(e.insufficientPermissions);
	}

	const result = await ItemService.create(req.body);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	/* There are no required params, but at least one editable param must be provided */
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return next(e.missingRequiredParams);
	
	const item = await ItemEntity.getItemOwnerId(req.params.itemId);
	if(item.err) return next(item.err);
	if(item.length < 1) next(e.itemNotFound);
	if(!AuthService.userHasAccessRights(u, item[0].ownerId)) {
		return next(e.insufficientPermissions);
	}

	const result = await ItemService.update(req.params.itemId, req.body);
	if(result.err) return next(result.err);
	return res.status(204).end();
}