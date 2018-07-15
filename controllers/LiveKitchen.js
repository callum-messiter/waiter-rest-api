const moment = require('moment');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Auth = require('../models/Auth');
const TableUser = require('../models/TableUser');
const LiveKitchen = require('../models/LiveKitchen');
const log = require('../helpers/logger');

const lrn = {
	connection: 'connection',
	disconnect: 'disconnect',
	newOrder: 'newOrder',
	orderStatusUpdate: 'orderStatusUpdate',
	restaurantAcceptedOrder: 'restaurantAcceptedOrder',
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
	recipientDinerNotConnected: 'The recipient diner is not connected to the WebSockets server'
}

module.exports.handler = function(socket) {
	var socketType;
	const query = socket.handshake.query;
	const data = {socketId: socket.id};

	if(query.hasOwnProperty('restaurantId')) {
		socketType = 'RestaurantSocket';
		data.restaurantId = query.restaurantId;
	} else if(query.hasOwnProperty('customerId')) {
		socketType = 'CustomerSocket';
		data.customerId = query.customerId;
	} else {
		// ToDO: inform client
		log.lkError(lrn.connection, e.missingUserParam);
		return socket.disconnect();
	}
	console.log('[CONN] ' + socketType + ' ' + socket.id + ' connected.');

	LiveKitchen.addSocket(data)
	.then((result) => {
		console.log('[DB] ' + socketType + ' ' + socket.id + ' added.');
		if(query.table === undefined) return true;
		return handleUserJoinedTable(JSON.parse(query.table), socket.id, errorType, lrn, e, socket)
	}).catch((err) => {
		return log.lkError(lrn.connection, err);
	});

	// Note when a client disconnects
	socket.on(lrn.disconnect, function () {
		console.log('[DISCONN] Client ' + socket.id + ' disconnected.');
		var type;
		if(query.hasOwnProperty('restaurantId')) {
			type = 'restaurant';
		} else if(query.hasOwnProperty('customerId')) {
			type = 'customer';
		} else {
			log.lkError(lrn.disconnect, e.missingUserParam);
			return socket.disconnect();
		}

		const tableData = {};
		LiveKitchen.removeSocket(socket.id, type)
		.then((result) => {
			console.log('[DB] Socket ' + socket.id + ' deleted.');
			if(!data.hasOwnProperty('customerId')) return true;
			return updateTableInfo(data.customerId, socket.id, errorType, lrn, e, socket);
		}).catch((err) => {
			return log.lkError(lrn.disconnect, err);
		});

	});

	socket.on(lrn.userJoinedTable, (data) => {
		console.log('[TABLE_UPDATE]: Restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
		TableUser.addUserToTable(data.table)
		.then((result) => {
			console.log('[DB] Table info added for restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
			return LiveKitchen.getRecipientRestaurantSockets(data.table.restaurantId);
		}).then((rSockets) => {

			if(rSockets.length < 1) {
				return log.lkError(lrn.userJoinedTable, e.recipientRestaurantNotConnected);
			}

			for(i = 0; i < rSockets.length; i++) {
				socket.broadcast.to(rSockets[i].socketId).emit(lrn.userJoinedTable, data.table);
			}
			console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
			return true;

		}).catch((err) => {
			return log.lkError(lrn.userJoinedTable, err);
		});
	});

	socket.on(lrn.userLeftTable, (data) => {
		console.log('[TABLE_UPDATE]: Restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
		TableUser.removeUserFromTable(data.table.customerId)
		.then((result) => {

			if(result.affectedRows < 1) return true;
			console.log('[DB] Table ' + data.table.tableNo + ' removed for restaurant ' + data.table.restaurantId);
			return LiveKitchen.getRecipientRestaurantSockets(data.table.restaurantId);

		}).then((rSockets) => {

			if(rSockets.length < 1) {
				return log.lkError(lrn.userLeftTable, e.recipientRestaurantNotConnected);
			}

			for(i = 0; i < rSockets.length; i++) {
				socket.broadcast.to(rSockets[i].socketId).emit(lrn.userLeftTable, data.table);
			}
			console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
			return true;

		}).catch((err) => {
			return log.lkError(lrn.userLeftTable, err);
		})
	});

	/**
		Listen to new orders sent by a customer
	**/
	socket.on(lrn.newOrder, (order) => {
		console.log('[ORDER] Received from ' + socket.id + '.');

		/* Times: store mysqlTimestamp in db; send unix timestamp to clients */
		const mysqlTimestamp = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');
		const unixTimestamp = order.metaData.time;

		// Verify the auth token
		Auth.verifyToken(order.headers.token).
		then((decodedpayload) => {

			console.log('[ORDER AUTH] ' + socket.id + ' authorised.');
			const socketData = {
				customerSocketId: socket.id,
				hostRestaurantId: order.metaData.restaurantId
			}

			// console.log('[DB] Socket ' + socket.id + ' added to SocketsRestaurantCustomers.');
			order.metaData.time = mysqlTimestamp;
			order.metaData.status = Order.statuses.receivedByServer; // Update order status
			return Order.createNewOrder(order);

		}).then((result) => {

			console.log('[DB] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' added.');
			order.metaData.time = unixTimestamp; 
			// Notify customer who placed the order
			socket.emit('orderStatusUpdated', {
				orderId: order.metaData.orderId, 
				status: Order.statuses.receivedByServer, // also explicitly set the order status for the createNewOrder query
				userMsg: Order.setStatusUpdateMsg(order.metaData.status)
			});

			return LiveKitchen.getRecipientRestaurantSockets(order.metaData.restaurantId);
		}).then((result) => {

			// TODO: inform client
			if(result.length < 1) {
				return log.lkError(lrn.newOrder, e.recipientRestaurantNotConnected);
			}

			// Unify the order metaData and order items as a single object
			order.metaData.status = Order.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
			const orderForRestaurant = order.metaData;
			orderForRestaurant.items = order.items;

			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit(lrn.newOrder, orderForRestaurant);
			}
			return console.log('[ORDER] Order sent to ' + result.length + ' sockets');

		}).catch((err) => {
			// TODO: inform client
			return log.lkError(lrn.newOrder, err);
		});
	});

	/**
		Listen to order-status updates made by the restauraut, e.g. "accepted", "rejected", and "enroute"
	**/
	socket.on(lrn.orderStatusUpdate, (order) => {
		// Verify the auth token
		Auth.verifyToken(order.headers.token)
		.then((decodedpayload) => {

			console.log('[STATUS-UPDATE AUTH] ' + socket.id + ' authorised.');
			order = order.metaData;
			// TODO: the server should set the status
			return Order.updateOrderStatus(order.orderId, order.status);

		}).then((result) => {

			// Check that the order was indeed updated
			Order.wasOrderUpdated(result);

			// Emit the order-status confirmation to the sender socket (the restaurant that sent the order-status update)
			socket.emit('orderStatusUpdated', {
				orderId: order.orderId, 
				status: order.status,
				userMsg: Order.setStatusUpdateMsg(order.status)
			});

			// Retrieve all connected sockets associated with the recipient restaurant (who updated the order's status)
			return LiveKitchen.getAllInterestedSockets(order.restaurantId, order.customerId);

		}).then((interestedSockets) => {

			if(interestedSockets.length < 1) {
				return log.lkError(lrn.orderStatusUpdate, e.recipientRestaurantNotConnected);
			}
			// Emit order-status=update confirmation to all connected sockets representing the recipient restaurant
			for(i = 0; i < interestedSockets.length; i++) {
				socket.broadcast.to(interestedSockets[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
			}
			console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + interestedSockets.length + ' sockets.');

		}).catch((err) => {
			return log.lkError(lrn.orderStatusUpdate, err);
		});
	});

	socket.on(lrn.restaurantAcceptedOrder, (order) => {
		return restaurantAcceptedOrder(order, socket);
	});
}

async function restaurantAcceptedOrder(order, socket) {
	order = order.metaData;
	/* All connected sockets representing the restaurant that accepted the order */
	const sockets = await LiveKitchen.async.getAllInterestedSockets(order.restaurantId, order.customerId);
	if(sockets.error) return log.lkError('getAllInterestedSockets', sockets.error);

	/* Once restaurant accepts, process payment (we stored the details in DB when customer placed order) */
	const details = await Payment.async.getOrderPaymentDetails(order.orderId);
	if(details.error) return log.lkError('getOrderPaymentDetails', details.error);

	var payload = { orderId: order.orderId, status: '', userMsg: '' };

	const charge = await Payment.async.processCustomerPaymentToRestaurant(details.data[0]);
	if(charge.error) {
		/* If failed, update status in DB and emit message to relevant sockets */
		const payFailStatus = Order.statuses.paymentFailed;
		const statusUpd = await Order.async.updateOrderStatus(order.orderId, payFailStatus);
		if(statusUpd.error) return log.lkError('updateOrderStatus', statusUpd.error);
		payload.status = payFailStatus;
		payload.userMsg = charge.error; /* Build msg based on Stripe error */
		emitEvent('orderStatusUpdated', payload, sockets.data, socket);
		return log.lkError('processCustomerPaymentToRestaurant', charge.error);
	}

	/* If payment was successful... */
	const payOkStatus = Order.statuses.paymentSuccessful;
	const updateRes = await Payment.async.updateChargeDetails(order.orderId, {
		chargeId: charge.data.id,
		paid: 1
	});
	if(updateRes.error) return log.lkError('updateChargeDetails', updateRes.error);

	const statusUpdate = await Order.async.updateOrderStatus(order.orderId, payOkStatus);
	if(statusUpdate.error) return log.lkError('updateOrderStatus', statusUpdate.error);
	
	payload.status = payOkStatus;
	payload.userMsg = Order.setStatusUpdateMsg(payOkStatus);
	return emitEvent('orderStatusUpdated', payload, sockets.data, socket);
}

function emitEvent(event, payload, recipients, socket) {
	socket.emit(event, payload); /* Emit the msg to the connected socket also */
	if(recipients.length < 1) return;
	for(var r of recipients) {
		socket.broadcast
		.to(r.socketId)
		.emit(event, payload);
	}
}

async function updateTableInfo(customerId, socketId, errorType, lrn, e, socket) {
	const tableData = {};

	/* Get table info to be sent to the restaurant */
	const tableInfo = await TableUser.getTableInfoByCustomer(customerId);
	if(tableInfo.length < 1) return true;
	tableData.restaurantId = tableInfo[0].restaurantId;
	tableData.customerId = tableInfo[0].customerId;
	tableData.tableNo = tableInfo[0].tableNo;

	/* Delete the user from the table */
	const removeUserFromTable = await TableUser.removeUserFromTable(tableData.customerId);
	if(removeUserFromTable.affectedRows < 1) return true;
	console.log('[DB] Table ' + tableData.tableNo + ' removed for restaurant ' + tableData.restaurantId);

	/* Forward the table update to the restaurant */
	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.length < 1) {
		log.lkError(errorType, e.recipientRestaurantNotConnected, socketId, lrn.newOrder);
		return true;
	}
	for(i = 0; i < rSockets.length; i++) {
		socket.broadcast.to(rSockets[i].socketId).emit(lrn.userLeftTable, tableData);
	}
	console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
	return true;
}

async function handleUserJoinedTable(tableData, socketId, errorType, lrn, e, socket) {
	const addUserToTable = await TableUser.addUserToTable(tableData);
	console.log('[DB] Table info added for restaurant ' + tableData.restaurantId + ', table ' + tableData.tableNo);
	
	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.length < 1) {
		return log.lkError(errorType, e.recipientRestaurantNotConnected, socket.id, lrn.userJoinedTable);
	}

	for(i = 0; i < rSockets.length; i++) {
		socket.broadcast.to(rSockets[i].socketId).emit(lrn.userJoinedTable, tableData);
	}
	console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
	return true;
}