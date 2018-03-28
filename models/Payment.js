const db = require('../config/database');
// const stripe = require("stripe")("sk_test_A9MV5fs8EX1RmXjpm59bk9JS");	

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

module.exports.createRestaurantStripeAccount = function() {
	/**
		stripe.accounts.create({
		  country: "UK", // should be dynamic
	 	  type: "custom "
		}).then(function(acct) {
		  // asynchronously called
		});
	**/
}

module.exports.getOrderPaymentDetails = function(orderId) {
	
} 