const CategoryService = require('../services/CategoryService');
const AuthService = require('../services/AuthService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

module.exports.create = async (req, res, next) => {
	const u = res.locals.authUser; /* This is set in the authentication middleware */

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) return next(e.insufficientRolePrivileges);

	const requiredParams = {
		query: [],
		body: ['menuId', 'name'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) return next(e.missingRequiredParams);

	const result = await CategoryService.create(req, u);
	if(result.err) return next(result.err);
	return res.status(201).json(result);
}

module.exports.update = async (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!AuthService.userHasRequiredRole(u.userRole, allowedRoles)) return next(e.insufficientRolePrivileges);

	/* There are no required params, but at least one editable param must be provided */
	const editableParams = ['name', 'description', 'active'];
	let noValidParams = true;
	for(const p of editableParams) {
		if(req.body[p]) {
			noValidParams = false;
		}
	}
	if(noValidParams) return next(e.missingRequiredParams);

	const result = await CategoryService.update(req, u);
	if(result.err) return next(result.err);
	return res.status(204).json();
}