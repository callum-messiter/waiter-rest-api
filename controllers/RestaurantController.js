const router = require('express').Router();
const shortId = require('shortid');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Auth = require('../models/Auth');
const User = require('../models/User');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

// TODO: condense queries 'getAllRestaurants', 'getAllMenus' into one; remove slash from route
router.get('/', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// TODO: roles allowed
	Restaurant.getAllRestaurants()
	.then((restaurants) => {

		res.locals.restaurants = JSON.parse(JSON.stringify(restaurants));
		// Add to each restaurant object a menus array, to be populated in the next block
		for(var i = 0; i < res.locals.restaurants.length; i++) {
			res.locals.restaurants[i].menus = [];
		}
		return Menu.getAllMenus();

	}).then((menus) => {

		res.locals.restaurants.forEach((r) => {
			// If the menu belongs to the restaurant, add it to the menus array
			menus.forEach((m) => {
				if(r.restaurantId == m.restaurantId) {
					r.menus.push({
						menuId: m.menuId,
						name: m.name
					});
				}
			});
		});
		return res.status(200).json( {data: res.locals.restaurants} );

	}).catch((err) => {
		return next(err);
	});
});

router.get('/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;
	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		// A restaurant's details can be retrieved by any user
		// if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.getRestaurantById(restaurantId);

	}).then((r) => {
		return Restaurant.getRestaurantDetails(restaurantId);
	}).then((details) => {

		/* Loop through array of key-value pairs from DB; build JSON response obj */
		const resObj = buildResponseObj(details);
		return res.status(200).json(resObj);

	}).catch((err) => {
		return next(err);
	});
});

// TODO: remove route param 'userId'; create restaurant for authUser.userId
router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['name', 'description'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurant = req.body;
	restaurant.restaurantId= shortId.generate(); // Assign ID
	restaurant.ownerId = u.userId; // Assign ownerId
	res.locals.restaurant = restaurant;

	// First check that the user exists
	User.getUserById(u.userId)
	.then((u) => {

		if(u.length < 1) throw e.userNotFound;
		return Restaurant.createNewRestaurant(restaurant);

	}).then((result) => {
		// TODO: change to 201; remove parent obj 'data'
		return res.status(200).json( {
			data: {
				createdRestaurantId: res.locals.restaurant.restaurantId
			}
		});

	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/update/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	// No *required* body params; but at least one must be provided
	const noValidParams = (req.body.name == undefined && req.body.description == undefined);
	if(req.params.restaurantId == undefined || noValidParams) throw e.missingRequiredParams;
	
	const restaurantId = req.params.restaurantId;
	const restaurantData = req.body;
	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.updateRestaurant(restaurantId, restaurantData);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

// TODO: change to PATCH
router.put('/deactivate/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	
	const restaurantId = req.params.restaurantId;
	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Restaurant.deactivateRestaurant(restaurantId);

	}).then((result) => {
		// TODO: change to 204
		return res.status(200).json({});
	}).catch((err) => {
		return next(err);
	});
});

/* Get all restaurant details from DB, and assign them to correct property in res object */
function buildResponseObj(details) {
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

module.exports = router;