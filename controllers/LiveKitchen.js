const moment = require('moment');
const OrderEntity = require('../entities/OrderEntity');
const PaymentEntity = require('../entities/PaymentEntity');
const AuthEntity = require('../entities/AuthEntity');
const TableUserEntity = require('../entities/TableUserEntity');
const LiveKitchenEntity = require('../entities/LiveKitchenEntity');
const roles = require('../entities/UserRolesEntity').roles;
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
	missingConnParam: '`socket.handshake.query.user` not set',
	missingConnUserParam: 'The client must provide the user role and id.',
	invalidUserRole: 'A valid user role, in integer form, must be provided by the client upon connection.',
	recipientRestaurantNotConnected: 'The recipient restaurant is not connected to the WebSockets server',
	recipientDinerNotConnected: 'The recipient diner is not connected to the WebSockets server',
	tableInfoNotFound: 'There is no record in the database relating the user to any restaurant table'
}

/* Need to add authentication */
module.exports.handler = async function(socket) {
	const query = socket.handshake.query;
	if(!query.hasOwnProperty('user')) {
		log.lkError(e.missingConnParam);
		return socket.disconnect();
	}

	const user = JSON.parse(query.user);
	if(!user.hasOwnProperty('role') || !user.hasOwnProperty('id')) {
		log.lkError(e.missingConnUserParam);
		return socket.disconnect();
	}

	const allowedRoles = [roles.diner, roles.restaurateur]; /* Need to handle admins too */
	if(!allowedRoles.includes(user.role)) {
		log.lkError(e.invalidUserRole);
		return socket.disconnect();
	}

	const socketData = { 
		socketId: socket.id,
		userId: user.id,
		role: user.role
	};
	const addSocket = await LiveKitchen.addSocket(socketData);
	if(addSocket.error) {
		log.lkError(addSocket.error);
		return socket.disconnect();
	}

	/* 
		If a diner connects, they may become an active member of a table (e.g. they have an item in their cart and they close the app, then open it).
		In such cases the client app will send the user's table data upon connection. We then add to the DB the user's association to this table,
		and forward this information to the relevant restaurant.
	*/
	if(socketData.role == roles.diner && query.table) {
		const tableData = {
			customerId: JSON.parse(query.table).customerId,
			restaurantId: JSON.parse(query.table).restaurantId,
			tableNo: JSON.parse(query.table).tableNo
		}
		handleUserJoinedTable(tableData, socket);
	}

	/* Add all event listeners here */
	socket.on(lrn.disconnect, () => handleDisconnection(socketData, socket) );
	socket.on(lrn.newOrder, (order) => handleNewOrder(order, socket) );
	socket.on(lrn.orderStatusUpdate, (order) => handleOrderStatusUpdate(order, socket) );
	socket.on(lrn.restaurantAcceptedOrder, (order) => handleOrderAcceptance(order, socket) );
	socket.on(lrn.processRefund, (order) => processRefund(order, socket) );
	socket.on(lrn.userJoinedTable, (data) => handleUserJoinedTable(data.table, socket) );
	socket.on(lrn.userLeftTable, (data) => handleUserLeftTable(data.table.customerId, socket) );
}

async function handleDisconnection(data, socket) {
	/* Change way remove and add sockets figure out user type (pass role) */
	const removeSocket = await LiveKitchenEntity.removeSocket(socket.id, data.role);
	if(removeSocket.err) return log.lkError(removeSocket.err);
	if(data.role != roles.diner) return;

	/* 
		When the user disconnects, they may at that point be an active member of a table.
		We therefore remove their association to the table, in the DB, upon disconnection from the server.
		This is because a user that is not connected to the server cannot reasonably be considered an active member of any table.
		This information is then forwarded to the relevant restaurant.
	*/
	return handleUserLeftTable(data.userId, socket);
}

async function handleNewOrder(order, socket) {
	/* Times: store mysqlTimestamp in db; send unix timestamp to clients */
	const mysqlTimestamp = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');
	const unixTimestamp = order.metaData.time;

	const orderObj = {
		metaData: {
			orderId: order.metaData.orderId,
			customerId: order.metaData.customerId,
			restaurantId: order.metaData.restaurantId,
			tableNo: order.metaData.tableNo,
			price: order.metaData.price,
			time: mysqlTimestamp,
			status: OrderEntity.statuses.receivedByServer
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

	const createOrder = await OrderEntity.createNewOrder(orderObj);
	if(createOrder.err) return log.lkError(createOrder.err);

	order.metaData.time = unixTimestamp;
	order.metaData.status = OrderEntity.statuses.receivedByServer;
	socket.emit('orderStatusUpdated', {
		orderId: order.metaData.orderId, 
		status: order.metaData.status,
		userMsg: OrderEntity.setStatusUpdateMsg(order.metaData.status)
	});

	const rSockets = await LiveKitchenEntity.getRecipientRestaurantSockets(order.metaData.restaurantId);
	if(rSockets.err) return log.lkError(rSockets.err);
	if(rSockets.length < 1) {
		return log.lkError(e.recipientRestaurantNotConnected);
	}

	/* We modify the order object to be sent to the restaurant - later use consistent models */
	order.metaData.status = OrderEntity.statuses.sentToKitchen
	const payload = order.metaData;
	payload.items = order.items;
	return emitEvent('newOrder', rSockets, payload, socket, false);
}

async function handleOrderStatusUpdate(order, socket) {
	const orderObj = {
		orderId: order.metaData.orderId,
		customerId: order.metaData.customerId,
		restaurantId: order.metaData.restaurantId,
		status: order.metaData.status
	};
	const updateStatus = await OrderEntity.updateOrderStatus(orderObj.orderId, orderObj.status);
	if(updateStatus.err) return log.lkError(updateStatus.err);

	const sockets = await LiveKitchenEntity.getAllInterestedSockets(orderObj.restaurantId, orderObj.customerId);
	if(sockets.err) return log.lkError(sockets.err);
	if(sockets.length < 1) return log.lkError(e.recipientRestaurantNotConnected);

	const payload = {
		orderId: orderObj.orderId,
		status: orderObj.status,
		userMsg: OrderEntity.setStatusUpdateMsg(orderObj.status)
	};
	return emitEvent('orderStatusUpdated', sockets, payload, socket);
}

async function handleOrderAcceptance(order, socket) {
	/* TODO: build orderObj */
	order = order.metaData;
	const sockets = await LiveKitchenEntity.getAllInterestedSockets(order.restaurantId, order.customerId);
	if(sockets.err) return log.lkError(sockets.err);

	/* Once restaurant accepts, process payment (we stored the details in DB when customer placed order) */
	const details = await PaymentEntity.getOrderPaymentDetails(order.orderId);
	if(details.err) return log.lkError(details.err);

	var payload = { orderId: order.orderId, status: '', userMsg: '' };

	const charge = await PaymentEntity.processCustomerPaymentToRestaurant(details[0]);
	if(charge.err) {
		const payFailStatus = OrderEntity.statuses.paymentFailed;
		const statusUpd = await OrderEntity.updateOrderStatus(order.orderId, payFailStatus);
		if(statusUpd.err) return log.lkError(statusUpd.err);
		payload.status = payFailStatus;
		payload.userMsg = charge.err;
		emitEvent('orderStatusUpdated', sockets, payload, socket);
		return log.lkError(charge.err);
	}

	/* If payment was successful... */
	const payOkStatus = OrderEntity.statuses.paymentSuccessful;
	const updateRes = await PaymentEntity.updateChargeDetails(order.orderId, {
		chargeId: charge.id,
		paid: 1
	});
	if(updateReserr) return log.lkError(updateReserr);

	const statusUpdate = await Order.updateOrderStatus(order.orderId, payOkStatus);
	if(statusUpdateerr) return log.lkError(statusUpdateerr);
	
	payload.status = payOkStatus;
	payload.userMsg = OrderEntity.setStatusUpdateMsg(payOkStatus);
	return emitEvent('orderStatusUpdated', sockets, payload, socket);
}

async function processRefund(order, socket) {
	const orderObj = {
		orderId: order.metaData.orderId,
		restaurantId: order.metaData.restaurantId, 
		customerId: order.metaData.customerId
	}
	
	/* All connected sockets representing the restaurant that requested the refund */
	const sockets = await LiveKitchen.getAllInterestedSockets(
		orderObj.restaurantId,
		orderObj.customerId
	);
	if(socketserr) return log.lkError(socketserr);

	const details = await PaymentEntity.getOrderPaymentDetails(orderObj.orderId);
	if(detailserr) return log.lkError(detailserr);
	if(details.length < 1) return log.lkError(errors.chargeNotFound);
	if(details[0].paid !== 1) return log.lkError(errors.cannotRefundUnpaidOrder);

	const chargeObj = {
		id: details[0].chargeId, 
		amount: details[0].amount
	};
	const refund = await PaymentEntity.refundCharge(chargeObj);
	if(refunderr) {
		const stripeErr = buildStripeErrObj(refunderr);
		return log.lkError(stripeErr);
	}

	const refundObj = {
		refundId: refund.id,
		chargeId: refund.charge,
		amount: refund.amount
	}
	const refundRef = await PaymentEntity.storeRefund(refundObj);
	if(refundReferr) return log.lkError(refundReferr);
	
	const refundStatus = OrderEntity.statuses.refunded;
	const statusUpdate = await Order.updateOrderStatus(
		orderObj.orderId, 
		refundStatus
	);
	if(statusUpdateerr) return log.lkError(statusUpdateerr);
	
	const payload = {
		orderId: orderObj.orderId,
		status: refundStatus,
		userMsg: OrderEntity.setStatusUpdateMsg(refundStatus)
	};
	return emitEvent('orderStatusUpdated', sockets, payload, socket);
}

async function handleUserJoinedTable(data, socket) {
	const tableData = {
		restaurantId: data.restaurantId,
		customerId: data.customerId,
		tableNo: data.tableNo
	}

	const addUserToTable = await TableUser.addUserToTable(tableData);
	if(addUserToTableerr) return log.lkError(addUserToTableerr);
	
	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSocketserr) return log.lkError(rSocketserr);
	if(rSockets.length < 1) {
		return log.lkError(e.recipientRestaurantNotConnected);
	}

	return emitEvent('userJoinedTable', rSockets, tableData, socket, false);
}

async function handleUserLeftTable(customerId, socket) {
	/* Retrieve table customer is currently assigned to */
	const tableInfo = await TableUser.getTableInfoByCustomer(customerId);
	if(tableInfoerr) return log.lkError(tableInfoerr);
	if(tableInfo.length < 1) return log.lkError(e.tableInfoNotFound);

	const tableData = {
		restaurantId: tableInfo[0].restaurantId,
		customerId: tableInfo[0].customerId,
		tableNo: tableInfo[0].tableNo
	}

	const removeUser = await TableUser.removeUserFromTable(tableData.customerId);
	if(removeUsererr) return log.lkError(removeUsererr);

	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSocketserr) return log.lkError(rSocketserr);
	if(rSockets.length < 1) return log.lkError(e.recipientRestaurantNotConnected);

	/* Inform the restaurant that the user is no longer an active member of the table */
	return emitEvent('userLeftTable', rSockets, tableData, socket, false);
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
	const stripeErr = PaymentEntity.isStripeError(error);
	if(!stripeErr) return errors.internalServerError;
	const errorObj = errors.stripeError;
	errorObj.statusCode = error.statusCode;
	errorObj.userMsg = PaymentEntity.setStripeMsg(error);
	errorObj.devMsg = error.code.concat(': ' + error.stack);
	return JSON.stringify(errorObj);
}