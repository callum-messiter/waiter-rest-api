const CategoryService = require('../services/CategoryService');
const AuthService = require('../services/AuthService');
const CategoryEntity = require('../entities/CategoryEntity');
const MenuEntity = require('../entities/MenuEntity');
const ParamHelper = require('../helpers/ParamHelper');
const editableParams = require('../services/CategoryService').editableParams;
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	const requiredParams = {
		query: [],
		body: ['menuId', 'name'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return next(e.missingRequiredParams);
	}

	const menu = await MenuEntity.getMenuOwnerId(categoryObj.menuId);
	if(menu.err) return next(menu.err);
	if(menu.length < 1) return next(e.menuNotFound);
	if( !AuthService.userHasAccessRights(u, menu[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await CategoryService.create(req.body);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) {
		return next(e.insufficientRolePrivileges);
	}

	/* There are no required params, but at least one editable param must be provided */
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return next(e.missingRequiredParams);

	const category = await CategoryEntity.getCategoryOwnerId(req.params.categoryId);
	if(category.err) return next(category.err);
	if(category.length < 1) return next(e.categoryNotFound);
	if( !AuthService.userHasAccessRights(u, category[0].ownerId) ) {
		return next(e.insufficientPermissions);
	}

	const result = await CategoryService.update(req.params.categoryId, req.body);
	if(result.err) return next(result.err);
	return res.status(204).end();
}