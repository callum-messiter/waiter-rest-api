const AuthEntity = require('../entities/AuthEntity');
const UserEntity = require('../entities/UserEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const MenuEntity = require('../entities/MenuEntity');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/error').errors;

module.exports.login = async (req) => {
	const getUser = await UserEntity.getUserByEmail(req.query.email);
	if(getUser.err) return { err: getUser.err };
	if(getUser.length < 1) return { err: e.emailNotRegistered };
	const user = getUser[0];
	if(user.roleId != roles.restaurateur) return { err: e.insufficientRolePrivileges };

	const checkPass = await UserEntity.checkPassword(req.query.password, user.password);
	if(checkPass.err) return { err: checkPass.err };
	if(!checkPass) return{ err: e.passwordIncorrect };

	const token = await AuthEntity.createUserToken(user.userId, user.roleId);
	if(token.err) return { err: token.err };

	const getRest = await RestaurantEntity.getRestaurantByOwnerId(user.userId);
	if(getRest.err) return { err: getRest.err };
	if(getRest.length < 1) return { err: e.restaurantNotFound };	
	const restaurant = getRest[0]; /* For now return 1st restaurant - user can only have 1 */

	let isVerified = false;
	const paymentInfo = await PaymentEntity.getRestaurantPaymentDetails(restaurant.restaurantId);
	if(paymentInfo.err) return { err: paymentInfo.err };
	if(paymentInfo.length > 0) {
		isVerified = (paymentInfo[0].isVerified) ? true : false;
		restaurant.isStripeAccountVerified = isVerified;
	}

	const getMenu = await MenuEntity.getMenuByRestaurantId(restaurant.restaurantId);
	if(getMenu.err) return { err: getMenu.err };	
	if(getMenu.length < 1) return { err: e.menuNotFound };
	const menu = getMenu[0]; /* For now return 1st menu - restaurant can have only 1 */
	return {
		user: {
			userId: user.userId,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			role: user.roleId,
			token: token
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
	}
}

module.exports.dinerLogin = async (req) => {
	const getUser = await UserEntity.getUserByEmail(req.query.email);
	if(getUser.err) return { err: getUser.err };
	if(getUser.length < 1) return { err: e.emailNotRegistered };
	const user = getUser[0];
	if(user.roleId != roles.diner) return { err: e.insufficientRolePrivileges };

	const checkPass = await UserEntity.checkPassword(req.query.password, user.password);
	if(checkPass.err) return { err: checkPass.err };
	if(!checkPass) return { err: e.passwordIncorrect };

	const token = await AuthEntity.createUserToken(user.userId, user.roleId);
	if(token.err) return { err: token.err };

	return {
		userId: user.userId,
		email: user.email,
		role: user.roleId,
		token: token
	};
}

module.exports.logout = async (req) => {
	/* TODO: check user exists */
	const token = await AuthEntity.createUserToken(user.userId, user.roleId);
	if(token.err) return { err: token.err };
	return true;
}

module.exports.userHasRequiredRole = (requesterRoleId, allowedRoles) => {
	if (allowedRoles.indexOf(requesterRoleId) === -1) return false;
	return true;
}

/** 
	Customers (100) can access resources they own
	Restaurants (200) can access resources they own
	InternalAdmins (500) can access any resources
**/
module.exports.userHasAccessRights = (requester, resourceOwnerId) => {
	const requesterIsAnAdmin = (requester.userRole == roles.waitrAdmin);
	const requesterOwnsResource = (requester.userId == resourceOwnerId); 
	// If the requester is not an admin, he must be the owner of the resource to access it
	if(!requesterIsAnAdmin && !requesterOwnsResource) return false;
	return true;
}