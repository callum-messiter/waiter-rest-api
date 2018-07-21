const db = require('../config/database');
const config = require('../config/config');
const stripe = require("stripe")(config.stripe.secretKey);
stripe.setApiVersion('2018-02-28');
const e = require('../helpers/error').errors;
const defaultUserMsg = require('../helpers/error').defaultUserMsg;	

/*
	As we migrate to async-await, we will use only the async-await version of the method, and remove the non-async-await version 
	once it's no longer it use
*/
module.exports.async = {
	getOrderPaymentDetails: (orderId) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'SELECT chargeId, source, destination, currency, amount, customerEmail, paid ' +
						  'FROM payments ' +
						  'WHERE orderId = ?';
			db.query(query, orderId, (err, details) => {
				if(err) {
					response.error = err;
				} else {
					response.data = details;
				}
				return resolve(response);
			});
		});
	},

	processCustomerPaymentToRestaurant: (payment) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			stripe.charges.create({
			  amount: payment.amount,
			  currency: payment.currency,
			  source: payment.source, // the stripe token representing the customer's card details
			  destination: {
			    account: payment.destination, // the recipient restaurant's stripe account ID
			  },
			  receipt_email: payment.customerEmail // the diner may specify an email address that is not their waitr one
			}).then((charge) => {
				response.data = charge;
				return resolve(response);
			}).catch((err) => {
				response.error = err;
				return resolve(response);
			});
		});
	},

	updateChargeDetails: (orderId, details) => {
		return new Promise((resolve, reject) => {
			var response = { error: undefined, data: null };
			const query = 'UPDATE payments SET ? ' +
						  'WHERE orderId = ?';
			db.query(query, [details, orderId], (err, result) => {
				if(err) {
					response.error = err;
					return resolve(response);
				}
				if(result.affectedRows < 1) {
					response.error = e.sqlUpdateFailed;
				} else {
					response.data = result;
				}
				return resolve(response);
			});
		});
	},

	refundCharge: (charge, totality=1) => {
		chargeObj = {
			charge: charge.id,
			amount: charge.amount * totality
		}
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			stripe.refunds.create(chargeObj)
			.then((refund) => {
				response.data = refund;
				return resolve(response);
			}).catch((err) => {
				response.error = err;
				return resolve(response);
			});
		});
	},

	storeRefund: (data) => {
		const refundObj = {
			refundId: data.refundId,
			chargeId: data.chargeId,
			amount: data.amount,
		}
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'INSERT INTO refunds SET ?';
			db.query(query, refundObj, (err, result) => {
				if(err) {
					response.error = err;
				} else {
					response.data = result;
				}
				return resolve(response);
			});
		});
	},

	getRestaurantPaymentDetails: (restaurantId) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'SELECT stripeAccountId AS destination, currency, isVerified ' + 
						  'FROM restaurantdetailspayment ' +
						  'WHERE restaurantId = ?';
			db.query(query, restaurantId, (err, details) => {
				if(err) {
					response.error = err;
				} else {
					response.data = details;
				}
				return resolve(response);
			});
		});
	}
}

module.exports.getRestaurantStripeAccount = function(stripeAccountId) {
	return new Promise((resolve, reject) => {
		stripe.accounts.retrieve(stripeAccountId)
		.then((account) => { resolve(account); })
		.catch((err) => { return reject(err); });
	});
}

module.exports.createRestaurantStripeAccount = function(accountObj) {
	return new Promise((resolve, reject) => {
		stripe.accounts.create(accountObj)
		.then((account) => {
			return resolve(account);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.updateStripeAccount = function(accountId, accountObj) {
	return new Promise((resolve, reject) => {
		stripe.accounts.update(accountId, accountObj)
		.then((account) => {
			return resolve(account);
		}).catch((err) => {
			return reject(err);
		});
	});
}

module.exports.getRestaurantPaymentDetails = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT stripeAccountId AS destination, currency, isVerified ' + 
					  'FROM restaurantdetailspayment ' +
					  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, details) => {
			if(err) return reject(err);
			resolve(details);
		});
	});
}

module.exports.saveRestaurantStripeMetaData = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetailspayment SET ?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			return resolve(result);
		});
	});
}

module.exports.updateRestaurantStripeMetaData = function(stripeAccountId, data) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE restaurantdetailspayment SET ? ' +
					  'WHERE stripeAccountId = ?';
		db.query(query, [data, stripeAccountId], (err, result) => {
			if(err) return reject(err);
			console.log(result);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			resolve(result);
		});
	});
}

module.exports.getOrderPaymentDetails = function(orderId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT source, destination, currency, amount, customerEmail, paid ' +
					  'FROM payments ' +
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, details) => {
			if(err) return reject(err);
			return resolve(details);
		});
	});
}

module.exports.processCustomerPaymentToRestaurant = function(payment) {
	return new Promise((resolve, reject) => {
		stripe.charges.create({
		  amount: payment.amount,
		  currency: payment.currency,
		  source: payment.source, // the stripe token representing the customer's card details
		  destination: {
		    account: payment.destination, // the recipient restaurant's stripe account ID
		  },
		  receipt_email: payment.customerEmail // the diner may specify an email address that is not their waitr one
		}).then((charge) => {
			return resolve(charge);
		}).catch((err) => {
			return reject(err);
		});
	});
}

/**
	When we do this, we reference the charge using the orderId.
	THis will be problematic if a single order can have multiple payments (this should not be allowed, enforce it.)
	But what if the the user tries to pay, the payment is rejected by Stripe, and then the user tries again?
	Then we will have two payment entries with the same orderId. 
	We have to receive the order, add the payment row, then when the order is accepted by the restaurant, 
	retrieve the payment row, and process the payment. 
	Then once payment is processed, we update the payment row by adding the chargeId we get back from Stripe, and by
	setting paid = 1.
	All we can do for now is impose a unique restriction on the payments.orderId column, and then if there is a payment
	error, the diner app will have to just reset the order (diner starts again, so the orderId will change).
	Later, we could set a unique paymentId - order.payment.paymentId.
**/
module.exports.updateChargeDetails = function(orderId, details) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE payments SET ? ' +
					  'WHERE orderId = ?';
		db.query(query, [details, orderId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}

module.exports.isStripeError = function(err) {
	switch (err.type) {
		case 'StripeCardError': // A declined card error
		case 'RateLimitError':
		case 'StripeInvalidRequestError':
		case 'StripeAPIError':
		case 'StripeConnectionError':
		case 'StripeAuthenticationError':
			return true;
		default:
			return false;
	}
}

module.exports.setStripeMsg = function(err) {
	switch(err.code) {
		case 'charge_already_refunded':
			return 'This order has already been refunded.';
		default: 
			return defaultUserMsg;
	}
}