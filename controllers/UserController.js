const router = require('express').Router();
const moment = require('moment');
const shortId = require('shortid');
const User = require('../models/User');
const UserRoles = require('../models/UserRoles');
const Auth = require('../models/Auth');
const Restaurant = require('../models/Restaurant');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	User.getUserById(res.locals.authUser.userId)
	.then((u) => {

		if(u.length < 1) throw e.userNotFound;
		return res.status(200).json({
			data: {
				userId: u[0].userId,
				email: u[0].email, 
				firstName: u[0].firstName,
				lastName: u[0].lastName,
				//isVerified: u[0].isVerified,
				//isActive: u[0].isActive
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

router.post('/r', (req, res, next) => {
	res.locals.newUser = {role: roles.restaurateur};

	const requiredParams = {
		query: [],
		body: ['email', 'password', 'firstName', 'lastName', 'restaurantName'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	User.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return User.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		res.locals.newUser.firstName = user.firstName;
		res.locals.newUser.lastName = user.lastName;
		return User.createNewUser(user);

	}).then((result) => {

		const userDetails = {
			userId: res.locals.newUser.userId,
			roleId: res.locals.newUser.role,
			startDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
		}
		return UserRoles.setUserRole(userDetails);

	}).then((result) => {

		// Create the user's restaurant, and the default menu with default categories
		const restaurant = {
			ownerId: res.locals.newUser.userId,
			restaurantId: shortId.generate(),
			name: req.body.restaurantName
		};
		const menu = {
			restaurantId: restaurant.restaurantId,
			menuId: shortId.generate(),
			name: 'Main Menu'
		};
		res.locals.newUser.restaurant = restaurant;
		res.locals.newUser.menu = menu;

		return Restaurant.createRestaurantWithDefaultMenu(restaurant, menu);

	}).then((result) => {

		return res.status(201).json({
			user: {
				userId: res.locals.newUser.userId, 
				userRole: res.locals.newUser.role,
				firstName: res.locals.newUser.firstName,
				lastName: res.locals.newUser.lastName
				//isVerified: false,
			},
			restaurant: res.locals.newUser.restaurant,
			menu: res.locals.newUser.menu
		});

	}).catch((err) => {
		return next(err);
	});
});

/**
	Create a new diner
**/
router.post('/d', (req, res, next) => {
	res.locals.newUser = {role: roles.diner};

	const requiredParams = {
		query: [],
		body: ['email', 'password', 'firstName', 'lastName'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	User.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return User.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		return User.createNewUser(user);

	}).then((result) => {

		const userDetails = {
			userId: res.locals.newUser.userId,
			roleId: res.locals.newUser.role,
			startDate: myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
		}
		return UserRoles.setUserRole(userDetails);

	}).then((result) => {

		return res.status(201).json({
			user: {
				userId: res.locals.newUser.userId, 
				userRole: res.locals.newUser.role,
				//isVerified: false,
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH; change route to '/details/:userId'
router.put('/updateDetails/:userId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.firstName == undefined && req.body.lastName == undefined);
	if(req.params.menuId == undefined || noValidParams) throw e.missingRequiredParams;

	const requiredParams = {
		query: [],
		body: ['firstName', 'lastName'],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const userId = req.params.userId;
	const userDetails = req.body;

	User.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		return User.updateUserDetails(userId, userDetails);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH; change route to '/password/:userId'
router.put('/updatePassword/:userId', (req, res, next) => {
	const u = res.locals.authUser;
	
	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['currentPassword', 'newPassword'],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	// Get the user's current hashed password
	User.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		// Check that the user has entered their current password correctly
		return User.checkPassword(req.body.currentPassword, user[0].password);

	}).then((passwordsMatch) => {

		if(!passwordsMatch) throw e.currentPasswordIncorrect;
		// Hash the new password
		return User.hashPassword(req.body.newPassword);

	}).then((newHashedPassword) => {

		// Update the user's password
		return User.updateUserPassword(req.params.userId, newHashedPassword);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:userId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	// Check that the user with the provided ID exists
	User.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		return User.deactivateUser(req.params.userId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;
