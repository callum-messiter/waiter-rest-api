const OrderEntity = require('../entities/OrderEntity');
const RestaurantEntity = require('../entities/RestaurantEntity');
const UserEntity = require('../entities/UserEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const AuthService = require('../services/AuthService');
const roles = require('../entities/UserRolesEntity').roles;
const e = require('../helpers/ErrorHelper').errors;
const ParamHelper = require('../helpers/ParamHelper');
const moment = require('moment');

module.exports.get = async (req, authUser) => {
	const requiredParams = {
		query: [],
		body: [],
		route: ['orderId']
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	const ownerId = await OrderEntity.getOrderOwnerId(req.params.orderId, authUser.userRole);
	if(ownerId.err) return { err: ownerId.err };
	if(ownerId.length < 1) return { err: e.orderNotFound };
	if(!AuthService.userHasAccessRights(authUser, ownerId[0].ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const order = await OrderEntity.getOrder(req.params.orderId);
	if(order.err) return { err: order.err };
	if(order.length < 1) return { err: e.internalServerError }; /* We confirmed its existence already ^ */

	let orderObj = {
		orderId: order[0].orderId,
		price: order[0].price,
		status: order[0].status,
		time: moment(order[0].time).unix(),
		items: order[0].items,
		customer: {
			id: order[0].customerId,
			firstName: order[0].customerFName,
			lastName: order[0].customerLName
		},
		restaurant: {
			id: order[0].restaurantId,
			name: order[0].restaurantName,
			tableNo: order[0].tableNo
		}
	};
	return orderObj;
}

module.exports.getList = async (req, authUser) => {
	const requiredParams = {
		query: ['liveOnly', 'ownerId'],
		body: [],
		route: []
	}
	if(ParamHelper.paramsMissing(req, requiredParams)) {
		return { err: e.missingRequiredParams };
	}

	/* If requester is diner -> userId. If requester is restaurateur -> restaurantId */
	const ordersOwnerId = req.query.ownerId;
	const liveOnly = (req.query.liveOnly == 'true') ? true : false;

	/* 
		Only admins can access the resources of others.
		Thus: 
			if requester is restaurateur, `ownerId` param must be the ID of a restaurant owned by the requester
			if requester is diner, `ownerId` param must a userId equal the userId of the requester
	*/
	let ownerId, potentialErr;
	if(authUser.userRole == roles.restaurateur) {

		/* The `ownerId` param is a restaurantId (the requester wants their restaurant's order history) */
		restaurantOwner = await RestaurantEntity.getRestaurantOwnerId(ordersOwnerId);
		if(restaurantOwner.err) return { err: restaurantOwner.err };
		if(restaurantOwner.length < 1) return { err: e.restaurantNotFound };
		ownerId = restaurantOwner[0].ownerId;

	} else if(authUser.userRole == roles.diner) {

		/* The `ownerId` param is a userId (the requester (diner) wants their own order history) */
		diner = await UserEntity.getUserById(ordersOwnerId);
		if(diner.err) return { err: diner.err };
		if(diner.length < 1) return { err: e.userNotFound };
		ownerId = diner[0].userId;

	} else {
		return { err: e.internalServerError }; /* Should never happen */
	}

	if(!AuthService.userHasAccessRights(authUser, ownerId)) {
		return { err: e.insufficientPermissions };
	}

	const orders = await OrderEntity.getAllOrders(
		ordersOwnerId, /* req.query.ownerId - a customerId or restaurantId */
		authUser.userRole, 
		liveOnly
	);
	if(orders.err) return { err: orders.err };

	let list = [];
	for(const o of orders) {
		list.push({
			orderId: o.orderId,
			price: o.price,
			status: o.status,
			time: moment(o.time).unix(),
			items: o.items,
			customer: {
				id: o.customerId,
				firstName: o.customerFName,
				lastName: o.customerLName
			},
			restaurant: {
				id: o.restaurantId,
				name: o.restaurantName,
				tableNo: o.tableNo
			}
		});
	}
	return list;
}

module.exports.refund = async (req, authUser) => {
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