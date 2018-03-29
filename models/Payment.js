const db = require('../config/database');
const stripe = require("stripe")(require('../config/stripe').secretKey);
stripe.setApiVersion('2018-02-28');
const e = require('../helpers/error').errors;	

module.exports.createRestaurantStripeAccount = function(account) {
	return new Promise((resolve, reject) => {
		stripe.accounts.create({
			type: "custom",
			email: account.email,
			business_name: account.restaurantName,		
			country: account.country,
			default_currency: account.currency,
			legal_entity: {
				dob: {
					day: '01',
					month: '12',
					year: '1970',
				},
				address: {
					city: 'Canterbury',
					line1: '12 Baker Street',
					postal_code: 'Ct33ld'
				},
				first_name: 'Jack',
				last_name: 'Swann',
				type: 'individual'
			}
			// external_account: account.stripeToken
		}).then((account) => {
			return resolve(account);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.tokenizeRestaurantBankAccountDetails = function(account) {
	return new Promise((resolve, reject) => {
		stripe.createToken('bank_account', {
			country: account.country,
			currency: account.currency,
			routing_number: account.routingNum,
			account_number: account.accountNum,
			account_holder_name: account.holderName,
			account_holder_type: account.holderType,
		}).then((token) => {
			return resolve(token);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.saveRestaurantStripeAccountDetails = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetailspayment SET ?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			return resolve(result);
		});
	});
}

module.exports.getOrderPaymentDetails = function(orderId) {
	
}

module.exports.processCustomerPaymentToRestaurant = function(order) {
	/*
		stripe.charges.create({
		  amount: payment.amount,
		  currency: payment.currency,
		  source: payment.stripeToken, // the stripe token representing the customer's card details
		  destination: {
		    account: payment.destination, // the recipient restaurant's stripe account ID
		  },
		}).then(function(charge) {
		  // asynchronously called
		});
	*/
}