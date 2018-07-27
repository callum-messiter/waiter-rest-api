const router = require('express').Router();
const RestaurantEntity = require('../entities/RestaurantEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const AuthEntity = require('../entities/AuthEntity');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const p = require('../helpers/ParamHelper');
const _ = require('underscore');

/* Stripe requires this info in the below format; we only handle the following values: */
const allowedCountries = ['GB'];
const allowedCurrencies = ['gbp'];

/* Get a restaurant's stripe account details */
router.get('/stripeAccount/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	RestaurantEntity.getRestaurantOwnerId(req.params.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		/* Get restaurants Stripe account ID */
		return PaymentEntity.getRestaurantPaymentDetails(req.params.restaurantId);

	}).then((details) => {	

		/* Return empty obj if restaurant has no stripe account yet */
		if(details.length < 1) return {};
		res.locals.stripeAccountId = details[0].destination;
		return PaymentEntity.getRestaurantStripeAccount(details[0].destination);

	}).then((account) => {

		/* Stripe will return the master account (Waitr) if can't find connected account (restaurant) */
		if(!_.isEmpty(account)) {
			if(account.id != res.locals.stripeAccountId) { account = {} };
		}
		return res.status(200).json(account);

	}).catch((err) => {
		return next(err);
	});
});

/* Create a restaurant's stripe account */
router.post('/stripeAccount', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const rid = req.body.restaurantId;
	RestaurantEntity.getRestaurantOwnerId(rid)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		/* Check that the restaurant doesn't already have a Stripe account */
		return PaymentEntity.getRestaurantPaymentDetails(rid);

	}).then((details) => {

		if(details.length > 0) throw e.multipleStripeAccountsForbidden;
		const account = parseAndValidateRequestParams(req); /* Build the Stripe Account object */
		if(_.isEmpty(account)) throw e.malformedRestaurantDetails;
		return PaymentEntity.createRestaurantStripeAccount(account);

	}).then((account) => {
		
		res.locals.account = account; /* Add so we can access it later */
		var isVerified = false;
		if(account.charges_enabled && account.payouts_enabled) { isVerified = true; }
		/* Add the details to the database */
		return PaymentEntity.saveRestaurantStripeMetaData({
			restaurantId: rid,
			isVerified: isVerified,
			stripeAccountId: account.id
		});

	}).then(() => {
		return res.status(200).json(res.locals.account);
	}).catch((err) => {
		return next(err);
	});
});

/* Update a restaurant's stripe account */
router.patch('/stripeAccount', (req, res, next) => {
	const u = res.locals.authUser;
	const allowedRoles = [roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: ['restaurantId'],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	RestaurantEntity.getRestaurantOwnerId(req.body.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		/* Get the restaurant's Stripe account ID */
		return PaymentEntity.getRestaurantPaymentDetails(req.body.restaurantId);

	}).then((details) => {	

		if(details.length < 1) throw e.restaurantDetailsNotFound;
		res.locals.details = details[0];
		const account = parseAndValidateRequestParams(req); // Build the Stripe Account object
		if(_.isEmpty(account)) throw e.malformedRestaurantDetails;
		return PaymentEntity.updateStripeAccount(details[0].destination, account);	

	}).then((account) => {
		
		res.locals.account = account;
		const preEdit = res.locals.details; /* Stripe account meta data before the account was updated */
		const isVerified = (account.charges_enabled && account.payouts_enabled) ? true : false;
		/* If the verification status has changed, update the meta data in the DB */
		if( isVerified !== Boolean(Number(preEdit.isVerified)) ) {
			return PaymentEntity.updateRestaurantStripeMetaData(preEdit.destination, {isVerified});
		}
		return true;

	}).then(() => {
		return res.status(200).json(res.locals.account);
	}).catch((err) => {
		return next(err);
	});
});

router.get('/restaurantDetails/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur];
	if(!AuthEntity.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;

	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	RestaurantEntity.getRestaurantOwnerId(req.params.restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;

		// Any diner can access this data
		if(u.userRole == roles.restaurateur) {
			if(!AuthEntity.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		}

		return PaymentEntity.getRestaurantPaymentDetails(req.params.restaurantId);

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
	const r = req.body;

	/** 
		General details
	**/
	if(isSetAndNotEmpty(r.type)) {
		// Return validation error if not 'custom'
		/* Add property to Stripe Account obj, to be sent to Stripe's API */
		account.type = r.type;
	}

	if(isSetAndNotEmpty(r.country)) {
		// Return validation error if not 'GB'
		account.country = r.country;
	}

	if(isSetAndNotEmpty(r.email)) {
		// Return validation error if not 'email'
		account.email = r.email;
	}

	/* The restaurant's bank account details in tokenised form */
	if(isSetAndNotEmpty(r.external_account)) {
		/* Add property to Stripe Account obj, to be sent to Stripe's API */
		account.external_account = r.external_account;
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
		}

		if(isSetAndNotEmpty(r.legal_entity.last_name)) {
			le.last_name = r.legal_entity.last_name;
		}

		if(isSetAndNotEmpty(r.legal_entity.business_name)) {
			le.business_name = r.legal_entity.business_name;
		}

		if(isSetAndNotEmpty(r.legal_entity.business_tax_id)) {
			le.business_tax_id = r.legal_entity.business_tax_id;
		}

		const allowedTypes = ['company']; /* Later we may accept `individual` */
		if(allowedTypes.includes(r.legal_entity.type)) {
			le.type = r.legal_entity.type;
		}


		/**
			Legal Entity Address (Company)
		**/
		if(isNonEmptyObj(r.legal_entity.address)) {
			account.legal_entity.address = {};
			const a = account.legal_entity.address;
			
			if(isSetAndNotEmpty(r.legal_entity.address.line1)) {
				a.line1 = r.legal_entity.address.line1;
			}

			if(isSetAndNotEmpty(r.legal_entity.address.city)) {
				a.city = r.legal_entity.address.city;
			}

			if(isSetAndNotEmpty(r.legal_entity.address.postal_code)) {
				a.postal_code = r.legal_entity.address.postal_code;
				const postcode = a.postal_code.replace(/\s+/g, '').toUpperCase();
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
			}

			if(isSetAndNotEmpty(r.legal_entity.personal_address.city)) {
				pa.city = r.legal_entity.personal_address.city;
			}

			if(isSetAndNotEmpty(r.legal_entity.personal_address.postal_code)) {
				pa.postal_code = r.legal_entity.personal_address.postal_code;
			}
		}

		/**
			Legal Entity Date of Birth (Company Representative)
		**/
		if(isNonEmptyObj(r.legal_entity.dob)) {
			account.legal_entity.dob = {};
			const dob = account.legal_entity.dob;
			const d = r.legal_entity.dob.day, m = r.legal_entity.dob.month, y = r.legal_entity.dob.year;

			if(isSetAndNotEmpty(d) && isSetAndNotEmpty(m) && isSetAndNotEmpty(y)) {
				dob.day = d, dob.month = m, dob.year = y; /* Set Stripe account obj props */
			}
		}
	}
	return account;
}

function isNonEmptyObj(param) {
	if(typeof param === 'object' && !isEmpty(param)) return true;
	return false;
}

function isSetAndNotEmpty(param) {
	if(param === undefined) return false;
	if(param === null) return false; 
	if(param.toString().replace(/\s+/g, '') == '') return false;
	return true;
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

**/

module.exports = router;