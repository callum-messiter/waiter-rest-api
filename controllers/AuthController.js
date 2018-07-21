const router = require('express').Router();
const Auth = require('../models/Auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Payment = require('../models/Payment');
const Menu = require('../models/Menu');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

router.get('/login', (req, res, next) => login(req, res, next) );

async function login(req, res, next) {
	const requiredParams = {
		query: ['email', 'password'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) return next(e.missingRequiredParams);

	const getUser = await User.async.getUserByEmail(req.query.email);
	if(getUser.error) return next(getUser.error);
	if(getUser.data.length < 1) return next(e.emailNotRegistered);
	const user = getUser.data[0];
	if(user.roleId == roles.diner) return next(e.insufficientRolePrivileges);

	const getPass = await User.async.checkPassword(req.query.password, user.password);
	if(getPass.error) return next(getPass.error);
	const passwordsMatch = getPass.data;
	if(!passwordsMatch) return next(e.passwordIncorrect);

	const createToken = await Auth.async.createUserToken(user.userId, user.roleId);
	if(createToken.error) return next(createToken.error);

	const getRest = await Restaurant.async.getRestaurantByOwnerId(user.userId);
	if(getRest.error) return next(getRest.error);
	if(getRest.data.length < 1) return next(e.restaurantNotFound);	
	const restaurant = getRest.data[0]; /* For now return 1st restaurant - user can only have 1 */

	let isVerified = false;
	const getPaymentInfo = await Payment.async.getRestaurantPaymentDetails(restaurant.restaurantId);
	if(getPaymentInfo.error) return next(getPaymentInfo.error);
	if(getPaymentInfo.data.length > 0) {
		const payment = getPaymentInfo.data[0];
		isVerified = (payment.isVerified) ? true : false;
		restaurant.isStripeAccountVerified = isVerified;
	}

	const getMenu = await Menu.async.getMenuByRestaurantId(restaurant.restaurantId);
	if(getMenu.error) return next(error);	
	if(getMenu.data.length < 1) return next(e.menuNotFound);
	const menu = getMenu.data[0]; /* For now return 1st menu - restaurant can have only 1 */

	return res.status(200).json({
		user: {
			userId: user.userId,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			role: user.roleId,
			token: createToken.data
		},
		restaurant: {
			restaurantId: restaurant.restaurantId,
			name: restaurant.name,
			isStripeAccountVerified: restaurant.isStripeAccountVerified
		},
		menu: {
			menuId: menu.menuId,
			name: menu.name
		}
	});
}

router.get('/login/d', (req, res, next) => {
	const requiredParams = {
		query: ['email', 'password'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	User.getUserByEmail(req.query.email)
	.then((user) => {

		if(user.length < 1) throw e.emailNotRegistered; // User obj is an array of matches returned by SQL
		if(user[0].isActive !== 1) throw e.userNotActive;
		if(user[0].roleId == roles.restaurateur) throw e.insufficientRolePrivileges;
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
				email: u.email,
				role: u.roleId,
				token: u.token
			}
		}});
	}).catch((err) => {
		return next(err);
	});
});

router.get('/logout', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: ['userId'],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	
	Auth.verifyToken(req.headers.authorization)
	.then((result) => {
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;