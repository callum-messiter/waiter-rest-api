const db = require('../config/database');
const config = require('../config/config');
const stripe = require("stripe")(config.stripe.secretKey);
stripe.setApiVersion('2018-02-28');
const e = require('../helpers/error').errors;
const defaultUserMsg = require('../helpers/error').defaultUserMsg;	

module.exports.isStripeError = (err) => {
	switch (err.type) {
		case 'StripeCardError': /* A declined-card error */
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

module.exports.setStripeMsg = (err) => {
	switch(err.code) {
		case 'charge_already_refunded':
			return 'This order has already been refunded.';
		default: 
			return defaultUserMsg;
	}
}

module.exports.getOrderPaymentDetails = (orderId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT chargeId, source, destination, currency, amount, customerEmail, paid ' +
					  'FROM payments ' +
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRestaurantPaymentDetails = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT stripeAccountId AS destination, currency, isVerified ' + 
					  'FROM restaurantdetailspayment ' +
					  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRestaurantStripeAccount = (stripeAccountId) => {
	return new Promise((resolve, reject) => {
		stripe.accounts.retrieve(stripeAccountId)
		.then((account) => {
			return resolve(account);
		}).catch((err) => {
			return resolve({ err: err });
		});
	});
}


module.exports.processCustomerPaymentToRestaurant = (payment) => {
	return new Promise((resolve, reject) => {
		stripe.charges.create({
		  amount: payment.amount,
		  currency: payment.currency,
		  source: payment.source, /* the stripe token representing the customer's card details */
		  destination: {
		    account: payment.destination, /* the recipient restaurant's stripe account ID */
		  },
		  receipt_email: payment.customerEmail /* the diner may specify an email address that is not their waitr one */
		}).then((charge) => {
			return resolve(charge);
		}).catch((err) => {
			return resolve({ err: err });
		});
	});
}

module.exports.refundCharge = (charge, totality=1) => {
	chargeObj = {
		charge: charge.id,
		amount: charge.amount * totality
	}
	
	return new Promise((resolve, reject) => {
		stripe.refunds.create(chargeObj)
		.then((refund) => {
			return resolve(refund);
		}).catch((err) => {
			return resolve({ err: err });
		});
	});
}

module.exports.storeRefund = (data) => {
	const refundObj = {
		refundId: data.refundId,
		chargeId: data.chargeId,
		amount: data.amount,
	}
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO refunds SET ?';
		db.query(query, refundObj, (err, result) => {
			if(err) return resolve({ err: err });
			return resolve(result);
		});
	});
}

module.exports.createRestaurantStripeAccount = (accountObj) => {
	return new Promise((resolve, reject) => {
		stripe.accounts.create(accountObj)
		.then((account) => {
			return resolve(account);
		}).catch((err) => {
			return resolve({ err: err });
		});
	});
}

module.exports.saveRestaurantStripeMetaData = (data) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetailspayment SET ?';
		db.query(query, data, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateChargeDetails = (orderId, details) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE payments SET ? ' +
					  'WHERE orderId = ?';
		db.query(query, [details, orderId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.updateStripeAccount = (accountId, accountObj) => {
	return new Promise((resolve, reject) => {
		stripe.accounts.update(accountId, accountObj)
		.then((account) => {
			return resolve(account);
		}).catch((err) => {
			return resolve({ err: err });
		});
	});
}

module.exports.updateRestaurantStripeMetaData = (stripeAccountId, data) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE restaurantdetailspayment SET ? ' +
					  'WHERE stripeAccountId = ?';
		db.query(query, [data, stripeAccountId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}