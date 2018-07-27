const AuthService = require('../services/AuthService');
const UserEntity = require('../entities/UserEntity');
const UserRolesEntity = require('../entities/UserRolesEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const roles = require('../entities/UserRolesEntity').roles;
const ParamHelper = require('../helpers/ParamHelper');
const Validator = require('../helpers/ValidationHelper');
const e = require('../helpers/ErrorHelper').errors;
const moment = require('moment');
const shortId = require('shortid');

const editableParams = ['firstName', 'lastName', 'email', 'password', 'active'];
module.exports.editableParams = editableParams;

module.exports.create = async (req) => {
	if(req.body.type === undefined) return { err: e.missingRequiredParams };
	let requiredBodyParams;
	
	if(req.body.type == 'diner') {
		requiredBodyParams = ['email', 'password', 'firstName', 'lastName'];
	} else if(req.body.type == 'restaurateur') {
		requiredBodyParams = ['email', 'password', 'firstName', 'lastName', 'restaurantName'];
	} else {
		return { err: e.invalidUserType };
	}

	const requiredParams = {
		query: [],
		body: requiredBodyParams,
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	if( !Validator.isValidEmail(req.body.email) ) {
		return { err: e.emailInvalid };
	}
	const usersWithEmail = await UserEntity.getUserByEmail(req.body.email);
	console.log(usersWithEmail);
	if(usersWithEmail.err) return { err: usersWithEmail.err };
	if(usersWithEmail.length > 0) {
		return { err: e.emailAlreadyRegistered };
	}

	if( !Validator.isValidPassword(req.body.password) ) {
		return { err: e.passwordInvalid };
	}
	const hash = await UserEntity.hashPassword(req.body.password);
	if(hash.err) return { err: hash.err };

	const userObj = {
		userId: shortId.generate(),
		email: req.body.email,
		password: hash,
		firstName: req.body.firstName,
		lastName: req.body.lastName
	}

	const create = await UserEntity.createNewUser(userObj);
	if(create.err) return { err: create.err };

	const userDetails = {
		userId: userObj.userId,
		roleId: roles[req.body.type],
		startDate: myDate = moment().format("YYYY-MM-DD HH:mm:ss")
	}

	const setRole = await UserRolesEntity.setUserRole(userDetails);
	if(setRole.err) return { err: setRole.err };

	let response = {
		user: {
			userId: userObj.userId, 
			userRole: userDetails.roleId,
			firstName: userObj.firstName,
			lastName: userObj.lastName
			//isVerified: false,
		}
	}

	/* When a restaurateur registers, create their restaurant and default menu */
	if(req.body.type == 'restaurateur') {
		const restaurant = {
			restaurantId: shortId.generate(),
			ownerId: userObj.userId,
			name: req.body.restaurantName
		};
		const menu = {
			menuId: shortId.generate(),
			restaurantId: restaurant.restaurantId,
			name: 'Main Menu'
		};

		const createRest = await RestaurantEntity.createRestaurantWithDefaultMenu(restaurant, menu);
		response.restaurant = restaurant;
		response.menu = menu;
	}

	return response;
}

module.exports.update = async (req, authUser) => {
	const uid = req.params.userId;
	const user = await UserEntity.getUserById(uid);
	if(user.err) return { err: user.err };
	if(user.length < 1) return { err: e.userNotFound };
	/* Non-admin users can update only their own details; admins can do any */
	if(!AuthService.userHasAccessRights(authUser, uid)) {
		return { err: e.insufficientPermissions };
	}

	let userObj = {}; /* Email/password can only be updated in isolation */
	if(req.body.email) {
		
		const email = await validateRequestToUpdateEmail(req.body.email, uid);
		if(email.err) return { err: email.err };
		userObj.email = String(req.body.email).toLowerCase();
		userObj.verified = false; /* User must verify the new email address */

	} else if(req.body.newPassword) {
		
		const pass = await validateRequestToUpdatePassword(req.body, user[0].password);
		if(pass.err) return { err: pass.err };
		/* If new password is valid, hash it */
		const hash = await UserEntity.hashPassword(req.body.newPassword);
		if(hash.err) return { err: hash.err };
		userObj.password = hash;

	} else {
		/* There are no required params, but at least one editable param must be provided */
		const noValidParams = await ParamHelper.noValidParams(req.body, editableParams);
		if(noValidParams) return { err: e.missingRequiredParams };
		userObj = ParamHelper.buildObjBasedOnParams(req.body, editableParams);
	}

	const update = await UserEntity.updateUserDetails(uid, userObj);
	return true;
}

const validateRequestToUpdateEmail = async (email, userId) => {
	if( !Validator.isValidEmail(email) ) {
		return { err: e.emailInvalid };
	}
	const usersWithEmail = await UserEntity.getUserByEmail(email);
	if(usersWithEmail.err) return { err: usersWithEmail.err };
	if(usersWithEmail.length > 0) {
		/* If the email address is already registerd to the requester, that's fine */
		if(usersWithEmail[0].userId != userId) {
			return { err: e.emailAlreadyRegistered };
		}
	}
	return true;
}

const validateRequestToUpdatePassword = async (reqParams, hash) => {
	/* Check current password is provided and is correct */
	if(!reqParams.currentPassword) return { err: e.missingRequiredParams };
	const match = await UserEntity.checkPassword(reqParams.currentPassword, hash); /* bcrypt: compare string with hash from DB */
	if(match.err) return { err: match.err };
	if(!match) return { err: e.passwordIncorrect };

	/* Check new password is a valid password */
	if( !Validator.isValidPassword(reqParams.newPassword) ) {
		return { err: e.passwordInvalid };
	}
	return true;
}