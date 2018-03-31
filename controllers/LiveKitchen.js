const moment = require('moment');
const Order = require('../models/Order');
const Payment = require('../models/payment');
const Auth = require('../models/Auth');
const LiveKitchen = require('../models/LiveKitchen');

module.exports.handler = function(socket) {
	var socketType;
	const query = socket.handshake.query;
	const data = {socketId: socket.id}

	if(query.hasOwnProperty('restaurantId')) {
		data.restaurantId = query.restaurantId;
		socketType = 'RestaurantSocket';
	} else if(query.hasOwnProperty('customerId')) {
		socketType = 'CustomerSocket';
		data.customerId = query.customerId;
	} else {
		// ToDO: Log to server, inform client
		console.log('[CONN ERR] customerId/restaurantId not found.');
		socket.disconnect();
	}
	console.log('[CONN] ' + socketType + ' ' + socket.id + ' connected.');

	LiveKitchen.addSocket(data)
	.then((result) => {
		return console.log('[DB] ' + socketType + ' ' + socket.id + ' added.');
	}).catch((err) => {
		return console.log(err);
	});

	// Note when a client disconnects
	socket.on('disconnect', function () {
		var type;
		console.log('[DISCONN] Client ' + socket.id + ' disconnected.');
		if(query.hasOwnProperty('restaurantId')) {
			type = 'restaurant';
		} else if(query.hasOwnProperty('customerId')) {
			type = 'customer';
		} else {
			// ToDO: log to server
			console.log('[DISCONN ERR] customerId/restaurantId not found.');
			// ToDO: Inform client
			socket.disconnect();
		}

		// TODO: if customer socket, also remove from SocketsRestaurantCustomers

		// ToDO: log to server, inform client
		LiveKitchen.removeSocket(socket.id, type)
		.then((result) => {
			return console.log('[DB] Socket ' + socket.id + ' deleted.')
		}).catch((err) => {
			return console.log('[DB ERR] ' + err);
		});
	});

	/**
		Listen to new orders sent by a customer
	**/
	socket.on('newOrder', (order) => {
		console.log('[ORDER] Received from ' + socket.id + '.');
		// Convert the UNIX timestamp to a DATETIME for the DB
		order.metaData.time = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');

		// Verify the auth token
		Auth.verifyToken(order.headers.token).
		then((decodedpayload) => {
			console.log('[ORDER AUTH] ' + socket.id + ' authorised.');
			const socketData = {
				customerSocketId: socket.id,
				hostRestaurantId: order.metaData.restaurantId
			}
			// Associate the customer socket with the restaurantId. Later the server will query the same table for any
			// sockets associated to the restaurant, such that we can route the order-status update (e.g. "order accepted") 
			// to the correct customer(s)
			return LiveKitchen.addSocketToRestaurantCustomers(socketData);

		}).then((result) => {
			console.log('[DB] Socket ' + socket.id + ' added to SocketsRestaurantCustomers.');
			order.metaData.status = Order.statuses.receivedByServer; // Update order status
			return Order.createNewOrder(order);

		}).then((result) => {

			console.log('[DB] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' added.');
			// Notify customer who placed the order
			socket.emit('orderStatusUpdated', {
				orderId: order.metaData.orderId, 
				status: Order.statuses.receivedByServer, // also explicitly set the order status for the createNewOrder query
				userMsg: Order.setStatusUpdateMsg(order.metaData.status)
			});

			return LiveKitchen.getRecipientRestaurantSockets(order.metaData.restaurantId);
		}).then((result) => {
			// TODO: log to server, inform client
			if(result.length < 1) return console.log('[ORDER ERR] Recipient restaurant ' + order.metaData.restaurantId + ' is not connected.');
			// Unify the order metaData and order items as a single object
			order.metaData.status = Order.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
			const orderForRestaurant = order.metaData;
			orderForRestaurant.items = order.items;

			// Emit the order to all connected sockets representing the recipient retaurant
			// **Because, e.g., if a restaurant has screens, and two instances of their LiveKitchen running, 
			// they will have two connected sockets; we need to update both in such cases.
			// We need to run a cron job that will go through and delete sockets that are x hours old, 
			// to clean the db of sockets which are no longer connected, but remain in the db because of
			// api crashes 
			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit('newOrder', orderForRestaurant);
				console.log('[ORDER] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' sent to ' + result[i].socketId + '.');
			}
			return true;

		}).catch((err) => {
			// TODO: log to server, inform client
			return console.log('[ORDER ERR] ' + err);
		});
	});

	/**
		Listen to order-status updates made by the restauraut, e.g. "accepted", "rejected", and "enroute"
	**/
	socket.on('orderStatusUpdate', (order) => {
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

			// If the order was accepted, now process the payment. First get the restaurant's Stripe Account ID
			if(order.status == Order.statuses.acceptedByKitchen) {
				return Payment.getOrderPaymentDetails(order.orderId)
				.then((details) => {

					return Payment.processCustomerPaymentToRestaurant(details[0]);
					
				}).then((charge) => {
					// Inform clients

					// If payment is successful, update the row in payments - paid = 1, chargeId = charge.id; inform clients
					return Payment.updateChargeDetails(order.orderId, {chargeId: charge.id, paid: 1});
					// If payment fails, inform the clients - the apps should handle this accordingly
				}).then(() => {
					return true;
				}).catch((err) => {
					// Return websockets error of type payment_error
					console.log('[PAYMENT ERR] ' + err);
					throw new Error('[PAYMENT ERR] ' + err);
				});
			}
			
			// Emit the order-status confirmation to the sender socket (the restaurant 
			// that sent the order-status update)
			socket.emit('orderStatusUpdated', {
				orderId: order.orderId, 
				status: order.status,
				userMsg: Order.setStatusUpdateMsg(order.status)
			});

			// Retrieve all connected sockets associated with the recipient restaurant (who updated the order's status)
			return LiveKitchen.getRecipientRestaurantSockets(order.restaurantId);
		}).then((result) => {
			if(result.length < 1) return console.log('[STATUS-UPDATE ERR] Recipient restaurant ' + order.restaurantId + ' is not connected.');
			// Emit order-status=update confirmation to all connected sockets representing the recipient restaurant
			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
				console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + result[i].socketId + '.');
			}

			return LiveKitchen.getRecipientCustomerSockets(order.customerId);

		}).then((result)=> {
			// TODO: we can combine the two socket arrays (restuarants and customers) and broadcast once
			if(result.length < 1) return console.log('[STATUS-UPDATE ERR] Recipient customer ' + order.customerId + ' is not connected.');
			// Emit the order-status update to all connected sockets representing the recipient customer
			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
				console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + result[i].socketId + '.');
			}

		}).catch((err) => {
			// TODO: log to server, inform client
			return console.log('[STATUS-UPDATE ERR] ' + err);
		});
	});
}