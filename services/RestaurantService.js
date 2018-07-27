const RestaurantEntity = require('../entities/RestaurantEntity');
const MenuEntity = require('../entities/MenuEntity');
const TableUserEntity = require('../entities/TableUserEntity');
const AuthService = require('../services/AuthService');
const ParamHelper = require('../helpers/ParamHelper');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const shortId = require('shortid');
const moment = require('moment');

const editableParams = ['name', 'description', 'location', 'phoneNumber', 'emailAddress', 'active'];
module.exports.editableParams = editableParams;

module.exports.get = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}
	const rid = req.params.restaurantId;

	/* Any diner or admin can access any restaurant. A restaurateur can access only restaurants they own */
	if(authUser.userRole == roles.restaurateur) {
		const ownerId = await RestaurantEntity.getRestaurantOwnerId(rid);
		if(ownerId.err) return { err: ownerId.err };
		if(ownerId.length < 1) return { err: e.restaurantNotFound };

		if(!AuthService.userHasAccessRights(authUser, ownerId[0].ownerId)) {
			return { err: e.insufficientPermissions };
		}
	}

	/* Get basic info */
	const restaurant = await RestaurantEntity.getRestaurantById(rid);
	if(restaurant.err) return { err: restaurant.err };

	/* TODO: set `restaurant.general` properties */

	/* Get additional info (Stripe details, location info etc.) */
	const details = await RestaurantEntity.getRestaurantDetails(rid);
	if(details.err) return { err: details.err };
	return buildResponseObj(details);
}

module.exports.getList = async (req, authUser) => {
	const restaurants = await RestaurantEntity.getAllRestaurants();
	if(restaurants.err) return { err: restaurants.err };
	const menus = await MenuEntity.getAllMenus();
	if(menus.err) return { err: menus.err };

	for(const r of restaurants) {
		r.menus = [];
		/* Check if any of the menus belongs to this restaurant */
		for(const m of menus) {
			if(m.restaurantId == r.restaurantId) {
				const menuObj = {
					menuId: m.menuId, 
					name: m.name
				}
				r.menus.push(menuObj);
			}
		}
	};
	return restaurants;
}

module.exports.getTableUsers = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	const rid = req.params.restaurantId;
	const ownerId = await RestaurantEntity.getRestaurantOwnerId(rid);
	if(ownerId.err) return { err: ownerId.err };
	if(ownerId.length < 1 ) return { err: e.restaurantNotFound };
	if(!AuthService.userHasAccessRights(authUser, ownerId[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const tableUsers = await TableUserEntity.getAllTableUsersForRestaurant(rid);
	if(tableUsers.err) return { err: tableUsers.err };

	/* Build response object */
	let result = [];
	for(const tu of tableUsers) {
		const tableUserObj = {
			id: tu.id,
			restaurantId: tu.restaurantId,
			customerId: tu.customerId,
			tableNo: tu.tableNo,
			time: moment(tu.time).unix()
		}
		result.push(tableUserObj);
	}
	return result;
}

module.exports.create = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: ['name'],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	/* TODO: have the request contain the ownerId as a body param */
	const user = serEntity.getUserById(authUser.userId);
	if(user.err) return { err: user.err };
	if(user.length < 1) return { err: e.userNotFound };

	const restaurantObj = {
		restaurantId: shortId.generate(),
		ownerId: authUser.userId,
		name: req.body.name,
		description: req.body.description || '',
		location: req.body.location || '',
		phoneNumber: req.body.phoneNumber || '',
		emailAddress: req.body.emailAddress || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}

	const create = await RestaurantEntity.createNewRestaurant(restaurantObj);
	if(create.err) return { err: create.err };
	return { restaurantId: restaurantObj.restaurantId };
}

/* `active` param must be '1' or '0' */
module.exports.update = async (req, authUser) => {
	const noValidParams = ParamHelper.noValidParams(req.body, editableParams);
	if(noValidParams) return { err: e.missingRequiredParams };
	
	const rid = req.params.restaurantId;	
	const ownerId = RestaurantEntity.getRestaurantOwnerId(rid);
	if(ownerId.err) return { err: ownerId.err };
	if(ownerId.length < 1 ) return { err: e.restaurantNotFound };

	const restaurantObj = ParamHelper.buildObjBasedOnParams(req.body, editableParams);
	const update = await RestaurantEntity.updateRestaurant(rid, restaurantObj);
	if(update.err) return { err: update.err };
	return true;
}

const buildResponseObj = (details) => {
	if (details.length < 1) return restaurant;
	for (const item of details) {
		switch (item.key) {
			case 'companyName_stripe':
				restaurant.stripe.companyName = item.value;
				break;
			case 'country_stripe':
				restaurant.stripe.country = item.value;
				break;
			case 'currency_stripe':
				restaurant.stripe.currency = item.value;
				break;
			case 'legalEntityType_stripe':
				restaurant.stripe.legalEntityType = item.value;
				break;
			case 'taxIdProvided_stripe':
				restaurant.stripe.taxIdProvided = (item.value == 1) ? true : false;
				break;
			case 'tosAccepted_stripe':
				restaurant.stripe.tosAccepted = (item.value == 1) ? true : false;
				break;
			case 'accountVerified_stripe':
				restaurant.stripe.accountVerified = (item.value == 1) ? true : false;
				break;

			case 'addressLine1_stripe':
				restaurant.stripe.companyAddress.line1 = item.value;
				break;
			case 'addressCity_stripe':
				restaurant.stripe.companyAddress.city = item.value;
				break;
			case 'addressPostcode_stripe':
				restaurant.stripe.companyAddress.postcode = item.value;
				break;

			case 'companyRepFName_stripe':
				restaurant.stripe.companyRep.firstName = item.value;
				break;
			case 'companyRepLName_stripe':
				restaurant.stripe.companyRep.lastName = item.value;
				break;
			case 'companyRepDob_stripe':
				restaurant.stripe.companyRep.dob = item.value;
				break;
			case 'companyRepAddressLine1_stripe':
				restaurant.stripe.companyRep.address.line1 = item.value;
				break;
			case 'companyRepAddressCity_stripe':
				restaurant.stripe.companyRep.address.city = item.value;
				break;
			case 'companyRepAddressPostcode_stripe':
				restaurant.stripe.companyRep.address.postcode = item.value;
				break;

			case 'bankAccountHolderName_stripe':
				restaurant.stripe.companyBankAccount.holderName = item.value;
				break;
			case 'bankAccountHolderType_stripe':
				restaurant.stripe.companyBankAccount.holderType = item.value;
				break;
			case 'bankAccountConnected_stripe':
				restaurant.stripe.companyBankAccount.isConnected = (item.value == 1) ? true : false;
				break;

			default:
				break;
		}
	}
	return restaurant;
}

/* Default Restaurant Details response object */
const restaurant = {
	general: {
		restaurantId: '',
		name: '',
		description: '',
		email: '',
		phoneNumber: '',
		address: {
			line1: '',
			city: '',
			postcode: '',
			country: ''
		},
		owner: {
			id: '',
			role: '',
			firstName: '',
			lastName: '',
			email: ''
		},
		registrationDate: ''
	},
	stripe: {
		companyName: '',
		country: '',
		legalEntityType: '', /* company or individual */
		additionalOwners: '', /* For now we set as empty string, send to Stripe, and don't store */
		currency: '',
		accountId: '',
		taxIdProvided: false,
		tosAccepted: false,
		accountVerified: false,

		companyAddress: {
			line1: '',
			city: '', 
			postcode: '',
		},

		companyRep: {
			firstName: '',
			lastName: '',
			dob: '', /* Store as `YYYY-MM-DD` string */
			address: {
				line1: '', 
				city: '',
				postcode: '',
			}
		},

		companyBankAccount: {
			isConnected: false,
			holderName: '',
			holderType: ''
		}
	},
	// menus: [],
	// orders: []
}