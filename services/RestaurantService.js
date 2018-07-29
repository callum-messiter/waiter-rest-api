const RestaurantEntity = require('../entities/RestaurantEntity');
const MenuEntity = require('../entities/MenuEntity');
const UserEntity = require('../entities/UserEntity');
const TableUserEntity = require('../entities/TableUserEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const MenuService = require('../services/MenuService');
const OrderService = require('../services/OrderService');
const AuthService = require('../services/AuthService');
const ParamHelper = require('../helpers/ParamHelper');
const V = require('../helpers/ValidationHelper');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const shortId = require('shortid');
const moment = require('moment');
const _ = require('underscore');

const editableParams = ['name', 'description', 'location', 'phoneNumber', 'emailAddress', 'active'];
module.exports.editableParams = editableParams;

/* Stripe requires this info in the below format; we only handle the following values: */
const allowedCountries = ['GB'];
const allowedCurrencies = ['gbp'];

module.exports.get = async (restaurantId) => {
	let restaurantObj = {
		general: {},
		stripeAccount: {},
		menus: [],
		orders: [],
		tableUsers: []
	}

	/* Get basic info */
	const restaurant = await RestaurantEntity.getRestaurantById(restaurantId);
	if(restaurant.err) return { err: restaurant.err };
	restaurantObj.general = {
		id: restaurant[0].restaurantId,
		name: restaurant[0].name,
		description: restaurant[0].description,
		location: restaurant[0].location,
		phoneNumber: restaurant[0].phoneNumber,
		emailAddress: restaurant[0].emailAddress,
		registrationDate: moment(restaurant[0].date).unix(),
		active: (restaurant[0].active == 1) ? true : false
	}

	const user = await UserEntity.getUserById(restaurant[0].ownerId);
	if(user.err) return { err: user.err };
	if(user.length < 1) return { err: e.internalServerError }; /* All restaurants must have an associated user */
	restaurantObj.general.owner = {
		id: user[0].userId,
		firstName: user[0].firstName,
		lastName: user[0].lastName,
		email: user[0].email,
		roleId: roles.restaurateur,
		active: (user[0].active == 1) ? true : false,
		verified: (user[0].verified == 1) ? true : false,
		registrationDate:  moment(user[0].date).unix()
	}
	
	const stripeAcc = await getStripeAccount(restaurantId);
	if(stripeAcc.err) return { err: stripeAcc.err };
	restaurantObj.stripeAccount = stripeAcc;
	
	const menuId = await MenuEntity.getMenuByRestaurantId(restaurantId);
	if(menuId.err) return { err: menuId.err };
	if(menuId.length > 0) {
		const menu = await MenuService.get(menuId[0].menuId);
		if(menu.err) return { err: menu.err };
		restaurantObj.menus = menu;
	}

	const orders = await OrderService.getList(restaurantId, roles.restaurateur);
	if(orders.err) return { err: orders.err };
	restaurantObj.orders = orders;

	const tableUsers = await getTableUsers(restaurantId);
	if(tableUsers.err) return { err: tableUsers.err };
	restaurantObj.tableUsers = tableUsers;

	return restaurantObj;
}

module.exports.getList = async () => {
	const restaurants = await RestaurantEntity.getAllRestaurants();
	if(restaurants.err) return { err: restaurants.err };

	for(const r of restaurants) {
		r.menus = [];
		const menuId = await MenuEntity.getMenuByRestaurantId(r.restaurantId);
		if(menuId.err) return { err: menuId.err };
		if(menuId.length > 0) {
			const menu = await MenuService.get(menuId[0].menuId);
			if(menu.err) return { err: menu.err };
			r.menus.push(menu);
		}
	};
	return restaurants;
}

const getTableUsers = async (restaurantId) => {
	const tableUsers = await TableUserEntity.getAllTableUsersForRestaurant(restaurantId);
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
module.exports.getTableUsers = getTableUsers;

module.exports.create = async (params) => {
	const restaurantObj = {
		restaurantId: shortId.generate(),
		ownerId: params.userId,
		name: params.name,
		description: params.description || '',
		location: params.location || '',
		phoneNumber: params.phoneNumber || '',
		emailAddress: params.emailAddress || '',
		date: moment().format('YYYY-MM-DD H:mm:ss'),
		active: 1
	}
	const create = await RestaurantEntity.createNewRestaurant(restaurantObj);
	if(create.err) return { err: create.err };
	return { restaurantId: restaurantObj.restaurantId };
}

module.exports.update = async (restaurantId, params) => {
	const restaurantObj = ParamHelper.buildObjBasedOnParams(params, editableParams);
	const update = await RestaurantEntity.updateRestaurant(restaurantId, restaurantObj);
	if(update.err) return { err: update.err };
	return true;
}

module.exports.updateStripeAccount = async (restaurantId, params) => {
	const details = await PaymentEntity.getRestaurantPaymentDetails(restaurantId);
	if(details.err) return { err: details.err };
	const d = details[0];

	/* Build the Stripe Account object */
	const accountObj = parseAndValidateRequestParams(params);
	if(_.isEmpty(accountObj)) return { err: e.malformedRestaurantDetails };

	/* If the restaurant doesn't have a stripe account yet, create it */
	let stripeAccountObj;
	if(details.length < 1) {
		const create = await createStripeAccount(accountObj, restaurantId);
		if(create.err) return { err: create.err };
		stripeAccountObj = create;
	} else {
		const update = await _updateStripeAccount(accountObj, d.destination, d.isVerified);
		if(update.err) return { err: update.err };
		stripeAccountObj = update;
	}
	return stripeAccountObj;
}

const getStripeAccount = async (restaurantId) => {
	const paymentInfo = await PaymentEntity.getRestaurantPaymentDetails(restaurantId);
	if(paymentInfo.err) return { err: paymentInfo.err };
	if(paymentInfo.length > 0) {
		const accountId = paymentInfo[0].destination;
		const stripeAcc = await PaymentEntity.getRestaurantStripeAccount(accountId);
		if(stripeAcc.err) return { err: stripeAcc.err };
		/* Stripe will return the master account (Waitr) if can't find connected account (restaurant) */
		if(!_.isEmpty(stripeAcc)) {
			if(stripeAcc.id == accountId) {
				return stripeAcc;
			}
		}
	}
	return {};
}

const _updateStripeAccount = async (accountObj, accountId, isVerified) => {
	/* If no error, Stripe API returns an account obj (= `updatedAcc`) */
	const updatedAcc = await PaymentEntity.updateStripeAccount(accountId, accountObj);
	if(updatedAcc.err) return { err: updatedAcc.err };

	/* If the update has affected the verification status of the Stripe account, update the meta data */
	const preEditStatus = Boolean( Number(isVerified) );
	const postEditStatus = (updatedAcc.charges_enabled && updatedAcc.payouts_enabled) ? true : false;
	if(postEditStatus !== preEditStatus) {
		const updateMd = await PaymentEntity.updateRestaurantStripeMetaData(
			accountId, /* Stripe Account ID */
			{ postEditStatus }
		);
		if(updateMd.err) return { err: updateMd.err };
	}
	return updatedAcc;
}

const createStripeAccount = async (accountObj, restaurantId) => {
	const account = await PaymentEntity.createRestaurantStripeAccount(accountObj);
	if(account.err) return { err: account.err };

	/* Add the details to the database */
	const stripeMetaDataObj = {
		restaurantId: restaurantId,
		isVerified: (account.charges_enabled && account.payouts_enabled),
		stripeAccountId: account.id
	}
	const saveInfo = await PaymentEntity.saveRestaurantStripeMetaData(stripeMetaDataObj);
	if(saveInfo.err) return { err: saveInfo.err };
	return account;
}

/**
	The client may send the entire object, or only the parameters being updated by the user.
	If the entire object is sent, we will only pass to Stripe those parameters which have been set.
	Any parameter which is undefined or equal to whitespace, will not be passed to Stripe.

		*Parameters required for verification*

		external_account,
		tos_acceptance: {
			date,
			ip
		},
		legal_entity: {
			first_name,
			last_name,
			type,
			business_name,
			business_tax_id,
			additional_owners, // Just provide an empty string for now
			address: {
				line1,
				city,
				postal_code
			},
			personal_address: {
				line1,
				city,
				postal_code
			},
			dob: {
				day,
				month,
				year
			}
		}

	TODO: return validation errors to client
**/
const parseAndValidateRequestParams = (r) => {
	const account = {}; /* Stripe account object for the Stripe API */

	/** 
		General details
	**/
	if(V.isSetAndNotEmpty(r.type)) {
		// Return validation error if not 'custom'
		/* Add property to Stripe Account obj, to be sent to Stripe's API */
		account.type = r.type;
	}

	if(V.isSetAndNotEmpty(r.country)) {
		// Return validation error if not 'GB'
		account.country = r.country;
	}

	if(V.isSetAndNotEmpty(r.email)) {
		// Return validation error if not 'email'
		account.email = r.email;
	}

	/* The restaurant's bank account details in tokenised form */
	if(V.isSetAndNotEmpty(r.external_account)) {
		/* Add property to Stripe Account obj, to be sent to Stripe's API */
		account.external_account = r.external_account;
	}

	/**
		Terms of Acceptance (date and IP address)
	**/
	if(V.isNonEmptyObj(r.tos_acceptance)) {
		account.tos_acceptance = {};
		const tosa = account.tos_acceptance;
		tosa.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		
		if(!isNaN(r.tos_acceptance.date)) {
			tosa.date = r.tos_acceptance.date;
		}
	}

	/**
		Legal Entity Object
	**/
	if(V.isNonEmptyObj(r.legal_entity)) {
		account.legal_entity = {};
		const le = account.legal_entity;

		/**
			Legal Entity Basic Details
		**/
		le.additional_owners = ''; /* Currently we don't allow the user to specify this in the restaurant app */

		if(V.isSetAndNotEmpty(r.legal_entity.first_name)) {
			le.first_name = r.legal_entity.first_name;
		}

		if(V.isSetAndNotEmpty(r.legal_entity.last_name)) {
			le.last_name = r.legal_entity.last_name;
		}

		if(V.isSetAndNotEmpty(r.legal_entity.business_name)) {
			le.business_name = r.legal_entity.business_name;
		}

		if(V.isSetAndNotEmpty(r.legal_entity.business_tax_id)) {
			le.business_tax_id = r.legal_entity.business_tax_id;
		}

		const allowedTypes = ['company']; /* Later we may accept `individual` */
		if(allowedTypes.includes(r.legal_entity.type)) {
			le.type = r.legal_entity.type;
		}


		/**
			Legal Entity Address (Company)
		**/
		if(V.isNonEmptyObj(r.legal_entity.address)) {
			account.legal_entity.address = {};
			const a = account.legal_entity.address;
			
			if(V.isSetAndNotEmpty(r.legal_entity.address.line1)) {
				a.line1 = r.legal_entity.address.line1;
			}

			if(V.isSetAndNotEmpty(r.legal_entity.address.city)) {
				a.city = r.legal_entity.address.city;
			}

			if(V.isSetAndNotEmpty(r.legal_entity.address.postal_code)) {
				a.postal_code = r.legal_entity.address.postal_code;
				const postcode = a.postal_code.replace(/\s+/g, '').toUpperCase();
			}
		}

		/**
			Legal Entity Personal Address (Company Representative)
		**/
		if(V.isNonEmptyObj(r.legal_entity.personal_address)) {
			account.legal_entity.personal_address = {};
			const pa = account.legal_entity.personal_address;
			
			if(V.isSetAndNotEmpty(r.legal_entity.personal_address.line1)) {
				pa.line1 = r.legal_entity.personal_address.line1;
			}

			if(V.isSetAndNotEmpty(r.legal_entity.personal_address.city)) {
				pa.city = r.legal_entity.personal_address.city;
			}

			if(V.isSetAndNotEmpty(r.legal_entity.personal_address.postal_code)) {
				pa.postal_code = r.legal_entity.personal_address.postal_code;
			}
		}

		/**
			Legal Entity Date of Birth (Company Representative)
		**/
		if(V.isNonEmptyObj(r.legal_entity.dob)) {
			account.legal_entity.dob = {};
			const dob = account.legal_entity.dob;
			const d = r.legal_entity.dob.day, m = r.legal_entity.dob.month, y = r.legal_entity.dob.year;

			if(V.isSetAndNotEmpty(d) && V.isSetAndNotEmpty(m) && V.isSetAndNotEmpty(y)) {
				dob.day = d, dob.month = m, dob.year = y; /* Set Stripe account obj props */
			}
		}
	}
	return account;
}

const setGeneralInfo = (details) => {
	if (details.length < 1) return {};
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
	return {};
}