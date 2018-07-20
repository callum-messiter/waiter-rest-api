const moment = require('moment');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Auth = require('../models/Auth');
const TableUser = require('../models/TableUser');
const LiveKitchen = require('../models/LiveKitchen');
const log = require('../helpers/logger');
const errors = require('../helpers/error').errors;

const lrn = {
	connection: 'connection',
	disconnect: 'disconnect',
	newOrder: 'newOrder',
	orderStatusUpdate: 'orderStatusUpdate',
	restaurantAcceptedOrder: 'restaurantAcceptedOrder',
	processRefund: 'processRefund',
	userJoinedTable: 'userJoinedTable',
	userLeftTable: 'userLeftTable'
}

const events = {
	orderStatusUpdated: 'orderStatusUpdated',
	userJoinedTable: 'userJoinedTable',
	userLeftTable: 'userLeftTable'
}

const e = {
	missingToken: 'order.headers.token is not set.',
	missingUserParam: '`socket.handshake.query.{userType}Id` not set',
	recipientRestaurantNotConnected: 'The recipient restaurant is not connected to the WebSockets server',
	recipientDinerNotConnected: 'The recipient diner is not connected to the WebSockets server',
	tableInfoNotFound: 'There is no record in the database relating the user to any restaurant table'
}

module.exports.handler = function(socket) {
	var socketType;
	const query = socket.handshake.query;
	const socketData = { socketId: socket.id };

	if(query.hasOwnProperty('restaurantId')) {
		socketData.restaurantId = query.restaurantId;
	} else if(query.hasOwnProperty('customerId')) {
		socketData.customerId = query.customerId;
	} else {
		log.lkError(e.missingUserParam);
		return socket.disconnect();
	}

	LiveKitchen.addSocket(socketData)
	.then((result) => {
		if(!query.table) return;

		const tableData = {
			customerId: JSON.parse(query.table).customerId,
			restaurantId: JSON.parse(query.table).restaurantId,
			tableNo: JSON.parse(query.table).tableNo
		}
		return handleUserJoinedTable(tableData, socket);
	}).catch((err) => {
		return log.lkError(err);
	});

	socket.on(lrn.disconnect, () => handleDisconnection(query, socket) );
	socket.on(lrn.newOrder, (order) => handleNewOrder(order, socket) );
	socket.on(lrn.orderStatusUpdate, (order) => handleOrderStatusUpdate(order, socket) );
	socket.on(lrn.restaurantAcceptedOrder, (order) => handleOrderAcceptance(order, socket) );
	socket.on(lrn.processRefund, (order) => processRefund(order, socket) );
	socket.on(lrn.userJoinedTable, (data) => handleUserJoinedTable(data.table, socket) );
	socket.on(lrn.userLeftTable, (data) => handleUserLeftTable(data.table.customerId, socket) );
}

async function handleDisconnection(query, socket) {
	var type;
	if(query.hasOwnProperty('restaurantId')) {
		type = 'restaurant';
	} else if(query.hasOwnProperty('customerId')) {
		type = 'customer';
	} else {
		log.lkError(e.missingUserParam);
		return socket.disconnect();
	}

	const removeSocket = await LiveKitchen.async.removeSocket(socket.id, type);
	if(removeSocket.error) return log.lkError(removeSocket.error);
	if(!query.hasOwnProperty('customerId')) return;

	return handleUserLeftTable(query.customerId, socket);
}

async function handleNewOrder(order, socket) {
	const orderObj = {
		metaData: {
			orderId: order.metaData.orderId,
			customerId: order.metaData.customerId,
			restaurantId: order.metaData.restaurantId,
			tableNo: order.metaData.tableNo,
			price: order.metaData.price,
			time: moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss'),
			status: Order.statuses.receivedByServer
		},
		payment: {
			orderId: order.payment.orderId,
			amount: order.payment.amount,
			currency: order.payment.currency,
			source: order.payment.source,
			destination: order.payment.destination,
			customerEmail: order.payment.customerEmail 
		},
		items: order.items
	};

	/* Times: store mysqlTimestamp in db; send unix timestamp to clients */
	const mysqlTimestamp = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');
	const unixTimestamp = order.metaData.time;

	//Order.createNewOrder(order);
	const createOrder = await Order.async.createNewOrder(orderObj);
	if(createOrder.error) return log.lkError(createOrder.error);

	order.metaData.time = unixTimestamp;
	order.metaData.status = Order.statuses.receivedByServer;
	socket.emit('orderStatusUpdated', {
		orderId: order.metaData.orderId, 
		status: order.metaData.status,
		userMsg: Order.setStatusUpdateMsg(order.metaData.status)
	});

	//LiveKitchen.getRecipientRestaurantSockets(order.metaData.restaurantId);
	const rSockets = await LiveKitchen.async.getRecipientRestaurantSockets(order.metaData.restaurantId);
	if(rSockets.error) return log.lkError(rSockets.error);
	if(rSockets.length < 1) {
		return log.lkError(e.recipientRestaurantNotConnected);
	}

	/* We modify the order object to be sent to the restaurant - later use consistent models */
	order.metaData.status = Order.statuses.sentToKitchen
	const payload = order.metaData;
	payload.items = order.items;
	return emitEvent('newOrder', rSockets.data, payload, socket, false);
}

async function handleOrderStatusUpdate(order, socket) {
	const orderObj = {
		orderId: order.metaData.orderId,
		customerId: order.metaData.customerId,
		restaurantId: order.metaData.restaurantId,
		status: order.metaData.status
	};
	const updateStatus = await Order.async.updateOrderStatus(orderObj.orderId, orderObj.status);
	if(updateStatus.error) return log.lkError(updateStatus.error);

	const sockets = await LiveKitchen.async.getAllInterestedSockets(orderObj.restaurantId, orderObj.customerId);
	if(sockets.error) return log.lkError(sockets.error);
	if(sockets.data.length < 1) return log.lkError(e.recipientRestaurantNotConnected);

	const payload = {
		orderId: orderObj.orderId,
		status: orderObj.status,
		userMsg: Order.setStatusUpdateMsg(orderObj.status)
	};
	return emitEvent('orderStatusUpdated', sockets.data, payload, socket);
}

async function handleOrderAcceptance(order, socket) {
	/* TODO: build orderObj */
	order = order.metaData;
	/* All connected sockets representing the restaurant that accepted the order */
	const sockets = await LiveKitchen.async.getAllInterestedSockets(order.restaurantId, order.customerId);
	if(sockets.error) return log.lkError(sockets.error);

	/* Once restaurant accepts, process payment (we stored the details in DB when customer placed order) */
	const details = await Payment.async.getOrderPaymentDetails(order.orderId);
	if(details.error) return log.lkError(details.error);

	var payload = { orderId: order.orderId, status: '', userMsg: '' };

	const charge = await Payment.async.processCustomerPaymentToRestaurant(details.data[0]);
	if(charge.error) {
		/* If failed, update status in DB and emit message to relevant sockets */
		const payFailStatus = Order.statuses.paymentFailed;
		const statusUpd = await Order.async.updateOrderStatus(order.orderId, payFailStatus);
		if(statusUpd.error) return log.lkError(statusUpd.error);
		payload.status = payFailStatus;
		payload.userMsg = charge.error; /* Build msg based on Stripe error */
		emitEvent('orderStatusUpdated', sockets.data, payload, socket);
		return log.lkError(charge.error);
	}

	/* If payment was successful... */
	const payOkStatus = Order.statuses.paymentSuccessful;
	const updateRes = await Payment.async.updateChargeDetails(order.orderId, {
		chargeId: charge.data.id,
		paid: 1
	});
	if(updateRes.error) return log.lkError(updateRes.error);

	const statusUpdate = await Order.async.updateOrderStatus(order.orderId, payOkStatus);
	if(statusUpdate.error) return log.lkError(statusUpdate.error);
	
	payload.status = payOkStatus;
	payload.userMsg = Order.setStatusUpdateMsg(payOkStatus);
	return emitEvent('orderStatusUpdated', sockets.data, payload, socket);
}

async function processRefund(order, socket) {
	const orderObj = {
		orderId: order.metaData.orderId,
		restaurantId: order.metaData.restaurantId, 
		customerId: order.metaData.customerId
	}
	
	/* All connected sockets representing the restaurant that requested the refund */
	const sockets = await LiveKitchen.async.getAllInterestedSockets(
		orderObj.restaurantId,
		orderObj.customerId
	);
	if(sockets.error) return log.lkError(sockets.error);

	const details = await Payment.async.getOrderPaymentDetails(orderObj.orderId);
	if(details.error) return log.lkError(details.error);
	if(details.data.length < 1) return log.lkError(errors.chargeNotFound);
	if(details.data[0].paid !== 1) return log.lkError(errors.cannotRefundUnpaidOrder);

	const chargeObj = {
		id: details.data[0].chargeId, 
		amount: details.data[0].amount
	};
	const refund = await Payment.async.refundCharge(chargeObj);
	if(refund.error) {
		const stripeErr = buildStripeErrObj(refund.error);
		return log.lkError(stripeErr);
	}

	const refundObj = {
		refundId: refund.data.id,
		chargeId: refund.data.charge,
		amount: refund.data.amount
	}
	const refundRef = await Payment.async.storeRefund(refundObj);
	if(refundRef.error) return log.lkError(refundRef.error);
	
	const refundStatus = Order.statuses.refunded;
	const statusUpdate = await Order.async.updateOrderStatus(
		orderObj.orderId, 
		refundStatus
	);
	if(statusUpdate.error) return log.lkError(statusUpdate.error);
	const payload = {
		orderId: orderObj.orderId,
		status: refundStatus,
		userMsg: Order.setStatusUpdateMsg(refundStatus)
	};
	return emitEvent('orderStatusUpdated', sockets.data, payload, socket);
}

async function handleUserJoinedTable(data, socket) {
	const tableData = {
		restaurantId: data.restaurantId,
		customerId: data.customerId,
		tableNo: data.tableNo
	}

	const addUserToTable = await TableUser.async.addUserToTable(tableData);
	if(addUserToTable.error) return log.lkError(addUserToTable.error);
	
	const rSockets = await LiveKitchen.async.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.error) return log.lkError(rSockets.error);
	if(rSockets.length < 1) {
		return log.lkError(e.recipientRestaurantNotConnected);
	}

	return emitEvent('userJoinedTable', rSockets.data, tableData, socket, false);
}

async function handleUserLeftTable(customerId, socket) {
	const tableInfo = await TableUser.async.getTableInfoByCustomer(customerId);
	if(tableInfo.error) return log.lkError(tableInfo.error);
	if(tableInfo.data.length < 1) return log.lkError(e.tableInfoNotFound);

	const tableData = {
		restaurantId: tableInfo.data[0].restaurantId,
		customerId: tableInfo.data[0].customerId,
		tableNo: tableInfo.data[0].tableNo
	}

	const removeUser = await TableUser.async.removeUserFromTable(tableData.customerId);
	if(removeUser.error) return log.lkError(removeUser.error);

	const rSockets = await LiveKitchen.async.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.error) return log.lkError(rSockets.error);
	if(rSockets.data.length < 1) return log.lkError(e.recipientRestaurantNotConnected);

	/* Inform the restaurant that the user is no longer an active member of the table */
	return emitEvent('userLeftTable', rSockets.data, tableData, socket, false);
}

function emitEvent(event, recipients, payload, socket, includeSocket=true) {
	if(includeSocket) {
		socket.emit(event, payload); /* Emit the msg to the connected socket also */
	}
	if(recipients.length < 1) return;
	for(var r of recipients) {
		socket.broadcast
		.to(r.socketId)
		.emit(event, payload);
	}
}

function buildStripeErrObj(error) {
	const stripeErr = Payment.isStripeError(error);
	if(!stripeErr) return errors.internalServerError;
	const errorObj = errors.stripeError;
	errorObj.statusCode = error.statusCode;
	errorObj.userMsg = Payment.setStripeMsg(error);
	errorObj.devMsg = error.code.concat(': ' + error.stack);
	return JSON.stringify(errorObj);
}