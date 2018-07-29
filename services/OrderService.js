const OrderEntity = require('../entities/OrderEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const UserEntity = require('../entities/UserEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const AuthService = require('../services/AuthService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const ParamHelper = require('../helpers/ParamHelper');
const moment = require('moment');

module.exports.get = async (orderId) => {
	const order = await OrderEntity.getOrder(req.params.orderId);
	if(order.err) return { err: order.err };
	if(order.length < 1) return { err: e.internalServerError };

	let orderObj = {
		id: order[0].orderId,
		price: order[0].price,
		status: order[0].status,
		timePlaced: moment(order[0].time).unix(),
		customer: {
			id: order[0].customerId,
			firstName: order[0].customerFName,
			lastName: order[0].customerLName
		},
		restaurant: {
			id: order[0].restaurantId,
			name: order[0].restaurantName,
			tableNo: order[0].tableNo
		},
		items: order[0].items
	};
	return orderObj;
}

module.exports.getList = async (ownerId, userRole, liveOnly=false) => {
	const orders = await OrderEntity.getAllOrders(ownerId, userRole, liveOnly);
	if(orders.err) return { err: orders.err };

	let list = [];
	for(const o of orders) {
		list.push({
			id: o.orderId,
			price: o.price,
			status: o.status,
			timePlaced: moment(o.time).unix(),
			customer: {
				id: o.customerId,
				firstName: o.customerFName,
				lastName: o.customerLName
			},
			restaurant: {
				id: o.restaurantId,
				name: o.restaurantName,
				tableNo: o.tableNo
			},
			items: o.items
		});
	}
	return list;
}

module.exports.refund = async (orderId) => {
	const order = await PaymentEntity.getOrderPaymentDetails(orderId);
	if(order.err) return { err: order.err };
	if(order.length < 1) return { err: e.chargeNotFound };
	if(order[0].paid !== 1) return { err: e.cannotRefundUnpaidOrder };

	const chargeObj = {
		id: order[0].chargeId, 
		amount: order[0].amount
	};

	const refund = await PaymentEntity.refundCharge(chargeObj);
	if(refund.err) {
		const stripeErr = PaymentEntity.isStripeError(refund.err); /* Move to PaymentService */
		if(!stripeErr) return { err: e.internalServerError };
		/* An error obj returned by Stripe's API */
		const errorObj = e.stripeError;
		errorObj.statusCode = refund.err.statusCode;
		errorObj.userMsg = PaymentEntity.setStripeMsg(refund.err); /* Move to PaymentService */
		errorObj.devMsg = refund.err.code.concat(': ' + refund.err.stack);
		return { err: errorObj };
	}

	const refundObj = {
		refundId: refund.id,
		chargeId: refund.charge,
		amount: refund.amount
	};

	const refundRef = await PaymentEntity.storeRefund(refundObj);
	if(refundRef.err) return refundRef.err;
	return true;
}

module.exports.assignItemsToOrders = (items, orders) => {
	for(const order of orders) { order.items = [] };
	for(const item of items) {
		const newItem = { itemId: item.itemId, name: item.name, price: item.price };
		/* Check if the item belongs to any of the orders */
		for(var order of orders) {
			if(item.orderId == order.orderId) {
				order.items.push(newItem);
			}
		}
	}
	return orders;
}