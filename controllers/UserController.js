// Dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const md5 = require('js-md5');
const shortId = require('shortid');
// Models
const Users = require('../models/Users');
const UserRoles = require('../models/UserRoles');
const Auth = require('../models/Auth');
const Restaurants = require('../models/Restaurants');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
// Config
const secret = require('../config/jwt').secret;
const modifiableUserDetails = Users.schema.requestBodyParams;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

/**
	Get single user by ID
**/
router.get('', (req, res, next) => {
	Users.getUserById(res.locals.authUser.userId)
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

/**
	Create a new restaurateur
**/
router.post('/r', (req, res, next) => {
	res.locals.newUser = {role: UserRoles.roleIDs['restaurateur']}

	const requiredParams = {
		query: [],
		body: ['email', 'password', 'firstName', 'lastName', 'userType', 'restaurantName'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Users.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return Users.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		return Users.createNewUser(user);

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

		return Restaurants.createRestaurantWithDefaultMenu(restaurant, menu);

	}).then((result) => {

		return res.status(201).json({
			user: {
				userId: res.locals.newUser.userId, 
				userRole: res.locals.newUser.role,
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
	res.locals.newUser = {role: UserRoles.roleIDs['diner']}

	const requiredParams = {
		query: [],
		body: ['email', 'password', 'firstName', 'lastName', 'userType'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Users.isEmailRegistered(req.body.email)
	.then((r) => {

		if(r.length > 0) throw e.emailAlreadyRegistered;
		return Users.hashPassword(req.body.password);

	}).then((hash) => {

		const user = {
			userId: shortId.generate(),
			email: req.body.email,
			password: hash,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}
		res.locals.newUser.userId = user.userId;
		return Users.createNewUser(user);

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

// TODO: change to PATCH
router.put('/deactivate/:userId', (req, res, next) => {
	const u = res.locals.authUser;

	const requiredParams = {
		query: [],
		body: [],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	// Check that the user with the provided ID exists
	Users.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		return Users.deactivateUser(req.params.userId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH; change route to '/details/:userId'
router.put('/updateDetails/:userId', (req, res, next) => {
	const u = res.locals.authUser;

	const requiredParams = {
		query: [],
		body: ['firstName', 'lastName'],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	const userId = req.params.userId;
	const userDetails = req.body;

	Users.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		return Users.updateUserDetails(userId, userDetails);

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
	
	const requiredParams = {
		query: [],
		body: ['currentPassword', 'newPassword'],
		route: ['userId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	// Get the user's current hashed password
	Users.getUserById(req.params.userId)
	.then((user) => {

		if(user.length < 1) throw e.userNotFound;
		// In this case the 'resource' is the user to be deactivated; the 'resource owner' is the user returned by the query
		if(!Auth.userHasAccessRights(u, req.params.userId)) throw e.insufficientPermissions;
		// Check that the user has entered their current password correctly
		return Users.checkPassword(req.body.currentPassword, user[0].password);

	}).then((passwordsMatch) => {
		
		if(!passwordsMatch) throw e.currentPasswordIncorrect;
		// Hash the new password
		return Users.hashPassword(req.body.newPassword);

	}).then((newHashedPassword) => {

		// Update the user's password
		return Users.updateUserPassword(req.params.userId, newHashedPassword);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;
