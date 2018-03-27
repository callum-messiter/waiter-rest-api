const router = require('express').Router();
const log = require('../helpers/logger');
const Auth = require('../models/Auth');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

const allowedClients = {
	webappDiners: '_webappDiners',
	webappRestaurants: '_webappRestaurants'
}

router.post('/error', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['msg', 'client'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	if(!allowedClients.hasOwnProperty(req.body.client)) throw e.invalidClientType;

	log.clientSideError(req.body.msg, allowedClients[req.body.client]);
	return res.status(200).json();
});

module.exports = router;