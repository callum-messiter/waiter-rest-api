const router = require('express').Router();
const Auth = require('../models/Auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const e = require('../helpers/error').errors;

router.get('/login', (req, res, next) => {
	if(req.query.email == undefined || req.query.password == undefined) throw e.missingRequiredParams;

	User.getUserByEmail(req.query.email)
	.then((user) => {

		if(user.length < 1) throw e.emailNotRegistered; // User obj is an array of matches returned by SQL
		if(user[0].isActive !== 1) throw e.userNotActive;
		res.locals = { user: JSON.parse(JSON.stringify(user[0])) }; // Add user to response-local var, accessible throughout the chain
		return User.checkPassword(req.query.password, user[0].password);

	}).then((passIsValid) => {

		if(passIsValid !== true) throw e.passwordIncorrect;
		const u = res.locals.user;
		return Auth.createUserToken(u.userId, u.roleId);

	}).then((token) => {

		res.locals.user.token = token;
		const u = res.locals.user;
		return RestaurantgetRestaurantByOwnerId(u.userId);

	}).then((restaurant) => {

		if(restaurant.length < 1) throw e.restaurantNotFound; // For now it is mandatory
		res.locals.restaurant = JSON.parse(JSON.stringify(restaurant[0]));
		return Menu.getMenuByRestaurantId(restaurant[0].restaurantId);

	}).then((menu) => {

		if(menu.length < 1) throw e.menuNotFound; // For now it is mandatory
		const u = res.locals.user;
		const r = res.locals.restaurant;
		return res.status(200).json({data: {
			user: {
				userId: u.userId,
				role: u.roleId,
				token: u.token
			},
			// For now we will return the first restaurant, since each user will only have one
			restaurant: {
				restaurantId: r.restaurantId,
				name: r.name
			},
			// For now we will return the first menu, since each restaurant will only have one
			menu: {
				menuId: menu[0].menuId,
				name: menu[0].name
			}
		}});

	}).catch((err) => {
		return next(err);
	});
});

router.get('/login/d', (req, res, next) => {
	if(req.query.email == undefined || req.query.password == undefined) throw e.missingRequiredParams;

	User.getUserByEmail(req.query.email)
	.then((user) => {

		if(user.length < 1) throw e.emailNotRegistered; // User obj is an array of matches returned by SQL
		if(user[0].isActive !== 1) throw e.userNotActive;
		res.locals = { user: JSON.parse(JSON.stringify(user[0])) }; // Add user to response-local var, accessible throughout the chain
		return User.checkPassword(req.query.password, user[0].password);

	}).then((passIsValid) => {

		if(passIsValid !== true) throw e.passwordIncorrect;
		const u = res.locals.user;
		return Auth.createUserToken(u.userId, u.roleId);

	}).then((token) => {

		res.locals.user.token = token;
		const u = res.locals.user;
		return res.status(200).json({data: {
			user: {
				userId: u.userId,
				role: u.roleId,
				token: u.token
			}
		}});
	}).catch((err) => {
		return next(err);
	});
});

router.get('/logout', (req, res, next) => {
	if(req.query.userId == undefined) throw e.missingRequiredParams;
	
	Auth.verifyToken(req.headers.authorization)
	.then((result) => {
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;