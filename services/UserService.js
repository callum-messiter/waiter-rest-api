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

module.exports.create = async (params) => {
	if( !Validator.isValidEmail(params.email) ) {
		return { err: e.emailInvalid };
	}
	const usersWithEmail = await UserEntity.getUserByEmail(params.email);
	if(usersWithEmail.err) return { err: usersWithEmail.err };
	if(usersWithEmail.length > 0) {
		return { err: e.emailAlreadyRegistered };
	}

	if( !Validator.isValidPassword(params.password) ) {
		return { err: e.passwordInvalid };
	}
	const hash = await UserEntity.hashPassword(params.password);
	if(hash.err) return { err: hash.err };

	const userObj = {
		userId: shortId.generate(),
		email: params.email,
		password: hash,
		firstName: params.firstName,
		lastName: params.lastName
	}

	const create = await UserEntity.createNewUser(userObj);
	if(create.err) return { err: create.err };

	const userDetails = {
		userId: userObj.userId,
		roleId: roles[params.type],
		startDate: myDate = moment().format("YYYY-MM-DD HH:mm:ss")
	}

	const setRole = await UserRolesEntity.setUserRole(userDetails);
	if(setRole.err) return { err: setRole.err };

	let response = {
		user: {
			userId: userObj.userId, 
			userRole: userDetails.roleId,
			firstName: userObj.firstName,
			lastName: userObj.lastName,
			email: userObj.email
			//isVerified: false,
		}
	}

	/* When a restaurateur registers, create their restaurant and default menu */
	if(params.type == 'restaurateur') {
		const restaurant = {
			restaurantId: shortId.generate(),
			ownerId: userObj.userId,
			name: params.restaurantName
		};
		const menu = {
			menuId: shortId.generate(),
			restaurantId: restaurant.restaurantId,
			name: 'Main Menu'
		};

		const createRest = await RestaurantEntity.createRestaurantWithDefaultMenu(restaurant, menu);
		if(createRest.err) return { err: createRest.err };
		response.restaurant = restaurant;
		response.menu = menu;
	}

	return response;
}

module.exports.update = async (user, params) => {
	let userObj = {}; /* Email/password can only be updated in isolation */
	if(params.email) {
		
		const email = await validateRequestToUpdateEmail(params.email, user.userId);
		if(email.err) return { err: email.err };
		userObj.email = String(params.email).toLowerCase();
		userObj.verified = false; /* User must verify the new email address */

	} else if(params.newPassword) {
		
		const pass = await validateRequestToUpdatePassword(params, user.password);
		if(pass.err) return { err: pass.err };
		/* If new password is valid, hash it */
		const hash = await UserEntity.hashPassword(params.newPassword);
		if(hash.err) return { err: hash.err };
		userObj.password = hash;

	} else {
		/* There are no required params, but at least one editable param must be provided */
		const noValidParams = await ParamHelper.noValidParams(params, editableParams);
		if(noValidParams) return { err: e.missingRequiredParams };
		userObj = ParamHelper.buildObjBasedOnParams(params, editableParams);
	}

	const update = await UserEntity.updateUserDetails(user.userId, userObj);
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