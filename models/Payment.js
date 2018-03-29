const db = require('../config/database');
const stripe = require("stripe")(require('../config/stripe').secretKey);	

module.exports.createRestaurantStripeAccount = function(account) {
	return new Promise((resolve, reject) => {
		stripe.accounts.create({
			country: account.country,
			type: 'custom',
			email: account.email,
			business_name: account.restaurantName,
			default_currency: account.currency,
			external_account: account.stripeToken
		}).then((acct) => {
			return resolve(acct);
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

module.exports.getOrderPaymentDetails = function(orderId) {
	
} 

module.exports.saveRestaurantStripeAccountDetails = function() {
	// Insert the restaurant's Stripe account ID (along with the restaurantId) into the database
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