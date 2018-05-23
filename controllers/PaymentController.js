const router = require('express').Router();
const Restaurant = require('../models/Restaurant');
const Payment = require('../models/Payment');
const Auth = require('../models/Auth');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

/* Stripe requires this info in the below format; we only handle the following values: */
const allowedCountries = ['GB'];
const allowedCurrencies = ['gbp'];

/**
	In order to allow a restaurant receive payments via waitr, we must create a Stripe account that 
	represents the restaurant.

	This account will be connected to the waitr Stripe account. Money will flow like so:

	Customer bank account -> Waitr Stripe account -> Recipient Restaurant Stripe account -> Restaurant bank account

	The following details are required to create the restaurant's Stripe account, and to allow payouts from the restaurant's
	Stripe account to their bank account:

	{
		country: "GB",
		type: "custom",
		email: "accountHolder@email.com",
		business_name: "restaurantName",
		default_currency: "GBP",
		external_account: "stripeToken" // returned when we send the card details to the Stripe API via the checkout form
	}

	When we create the account via Stripe, Stripe will respond with an object, containing an ID. We must store this ID in 
	the database, so that we can reference the restaurant's Stripe account for payments/charges (`destination`).
**/
router.post('/createStripeAccount', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Restaurant.getRestaurantOwnerId(req.body.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		// TODO: Plug in the data dynamically using the req.body
		return Payment.createRestaurantStripeAccount(req.body.restaurantId);

	}).then((account) => {

		return Payment.saveRestaurantStripeAccountDetails({
			restaurantId: req.body.restaurantId, 
			stripeAccountId: account.id}
		);

	}).then(() => {
		return res.status(200).json();
	}).catch((err) => {
		return next(err);
	});
});

/**
	For when the restaurant needs to update the details of their account, e.g. their bank account details.

	The requested must provide ther restaurant's ID. We will use this to query the database for the restaurant's
	Stripe Account ID. We will use this ID to call Stripe's API.
**/
router.patch('/updateStripeAccount', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	console.log(JSON.stringify(req.body));
	// Get the restaurant's Stripe account details
	Restaurant.getRestaurantOwnerId(req.body.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Payment.getRestaurantPaymentDetails(req.body.restaurantId);

	}).then((details) => {	

		if(details.length < 1) throw e.restaurantDetailsNotFound;
		const result = parseAndValidateRequestParams(req); // Build the Stripe Account object
		res.locals.response = result;
		return Payment.updateStripeAccount(details[0].destination, result.stripeAcc);	

	}).then((account) => {

		const r = res.locals.response;
		res.locals.response.account = account;
		return Restaurant.updateRestaurantDetails(req.body.restaurantId, r.restaurantDetails);

	}).then(() => {
		return res.status(200).json(res.locals.response.account);
	}).catch((err) => {
		return next(err);
	});
});

router.get('/restaurantDetails/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Restaurant.getRestaurantOwnerId(req.params.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;

		// Any diner can access this data
		if(u.userRole == roles.restaurateur) {
			if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		}

		return Payment.getRestaurantPaymentDetails(req.params.restaurantId);

	}).then((details) => {

		if(details.length < 1) throw e.restaurantDetailsNotFound;
		return res.status(200).json(details[0]);

	}).catch((err) => {
		return next(err);
	});
});

/**
	The client may send the entire object, or only the parameters being updated by the user.
	If the entire object is sent, we will only pass to Stripe those parameters which have been set.
	Any parameter which is undefined or equal to whitespace, will not be passed to Stripe.
**/
// TODO: return validation errors to client
function parseAndValidateRequestParams(req) {
	const account = {}; /* Stripe account object for the Stripe API */
	const restaurantDetails = []; /* To be inserted into our DB, so we can keep track of details provided */
	const rd = Restaurant.allowedRestaurantDetails;
	const r = req.body;

	/**
		External Account (the restaurant's bank account details in tokenised form)
	**/
	if(isSetAndNotEmpty(r.external_account)) {
		/* Add property to Stripe Account obj, to be sent to Stripe's API */
		account.external_account = r.external_account;
		/* Keep a record of this detail in the `restaurantdetails` table (`restaurantId`, `key`, `value`) */
		restaurantDetails.push([
			r.restaurantId, /* `restaurantId` */
			rd.bankAccountConnected_stripe, /* `key` (must be an allowed key - see Restaurant model) */
			true /* `value` */
		]);

		/* Each block below works in the same way as explained here... */
	}

	/**
		Terms of Acceptance (date and IP address)
	**/
	if(isNonEmptyObj(r.tos_acceptance)) {
		account.tos_acceptance = {};
		const tosa = account.tos_acceptance;
		tosa.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		
		if(!isNaN(r.tos_acceptance.date)) {
			tosa.date = r.tos_acceptance.date;
			restaurantDetails.push([r.restaurantId, rd.tosAccepted_stripe, true]);
		}
	}

	/**
		Legal Entity Object
	**/
	if(isNonEmptyObj(r.legal_entity)) {
		account.legal_entity = {};
		const le = account.legal_entity;

		/**
			Legal Entity Basic Details
		**/
		le.additional_owners = ''; /* Currently we don't allow the user to specify this in the restaurant app */

		if(isSetAndNotEmpty(r.legal_entity.first_name)) {
			le.first_name = r.legal_entity.first_name;
			restaurantDetails.push([r.restaurantId, rd.companyRepFName_stripe, le.first_name]);
		}

		if(isSetAndNotEmpty(r.legal_entity.last_name)) {
			le.last_name = r.legal_entity.last_name;
			restaurantDetails.push([r.restaurantId, rd.companyRepLName_stripe, le.last_name]);
		}

		if(isSetAndNotEmpty(r.legal_entity.business_name)) {
			le.business_name = r.legal_entity.business_name;
			restaurantDetails.push([r.restaurantId, rd.companyName_stripe, le.business_name]);
		}

		if(isSetAndNotEmpty(r.legal_entity.business_tax_id)) {
			le.business_tax_id = r.legal_entity.business_tax_id;
			restaurantDetails.push([r.restaurantId, rd.taxIdProvided_stripe, true]);
		}

		const allowedTypes = ['company']; /* Later we may accept `individual` */
		if(allowedTypes.includes(r.legal_entity.type)) {
			le.type = r.legal_entity.type;
			restaurantDetails.push([r.restaurantId, rd.legalEntityType_stripe, le.type]);
		}

		/**
			Legal Entity Address (Company)
		**/
		if(isNonEmptyObj(r.legal_entity.address)) {
			account.legal_entity.address = {};
			const a = account.legal_entity.address;
			
			if(isSetAndNotEmpty(r.legal_entity.address.line1)) {
				a.line1 = r.legal_entity.address.line1;
				restaurantDetails.push([r.restaurantId, rd.addressLine1_stripe, a.line1]);
			}

			if(isSetAndNotEmpty(r.legal_entity.address.city)) {
				a.city = r.legal_entity.address.city;
				restaurantDetails.push([r.restaurantId, rd.addressCity_stripe, a.city]);
			}

			if(isSetAndNotEmpty(r.legal_entity.address.postal_code)) {
				a.postal_code = r.legal_entity.address.postal_code;
				const postcode = a.postal_code.replace(/\s+/g, '').toUpperCase();
				restaurantDetails.push([r.restaurantId, rd.addressPostcode_stripe, postcode]);
			}
		}

		/**
			Legal Entity Personal Address (Company Representative)
		**/
		if(isNonEmptyObj(r.legal_entity.personal_address)) {
			account.legal_entity.personal_address = {};
			const pa = account.legal_entity.personal_address;
			
			if(isSetAndNotEmpty(r.legal_entity.personal_address.line1)) {
				pa.line1 = r.legal_entity.personal_address.line1;
				restaurantDetails.push([r.restaurantId, rd.companyRepAddressLine1_stripe, pa.line1]);
			}

			if(isSetAndNotEmpty(r.legal_entity.personal_address.city)) {
				pa.city = r.legal_entity.personal_address.city;
				restaurantDetails.push([r.restaurantId, rd.companyRepAddressCity_stripe, pa.city]);
			}

			if(isSetAndNotEmpty(r.legal_entity.personal_address.postal_code)) {
				pa.postal_code = r.legal_entity.personal_address.postal_code;
				const postcode = pa.postal_code.replace(/\s+/g, '').toUpperCase();
				restaurantDetails.push([r.restaurantId, rd.companyRepAddressPostcode_stripe, postcode]);
			}
		}

		/**
			Legal Entity Date of Birth (Company Representative)
		**/
		if(isNonEmptyObj(r.legal_entity.dob)) {
			account.legal_entity.dob = {};
			const dob = account.legal_entity.dob;
			var dobString = '';
			const d = r.legal_entity.dob.day, m = r.legal_entity.dob.month, y = r.legal_entity.dob.year;

			if(isSetAndNotEmpty(d) && isSetAndNotEmpty(m) && isSetAndNotEmpty(y)) {
				dob.day = d, dob.month = m, dob.year = y; /* Set Stripe account obj props */
				dobString = y + '-' + m + '-' + d; /* Create date string to be stored in the DB */
			}

			if(isValidDate(dobString)) {
				restaurantDetails.push([r.restaurantId, rd.companyRepDob_stripe, dobString]);
			}
		}
	}
	return {stripeAcc: account, restaurantDetails: restaurantDetails};
}

function isNonEmptyObj(param) {
	if(typeof param === 'object' && !isEmpty(param)) return true;
	return false;
}

function isSetAndNotEmpty(param) {
	if(param !== undefined && param.toString().replace(/\s+/g, '') != '') return true;
	return false;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) return false;
    }
    return true;
}

function isValidDate(dateString) {
	const regEx = /^\d{4}-\d{2}-\d{2}$/;
	if(!dateString.match(regEx)) return false;  /* Invalid format */
	const d = new Date(dateString);
	if(!d.getTime() && d.getTime() !== 0) return false; /* Invalid date */
	return d.toISOString().slice(0,10) === dateString;
}

/**

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

**/

module.exports = router;