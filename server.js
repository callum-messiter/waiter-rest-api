// Depdendencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const socket = require('socket.io');
const router = express.Router();
// Config
const dbConfig = require('./config/database');
const api = require('./routes/api');
const port = 3000;

/**
	START: SERVER CONFIGURATION SETTINGS
**/

// Enable cors
app.use(cors());

// Parses the body of an incoming request as JSON, and exposes it on req.body - easy to interface with
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs');

// Set the 'public' directory as the home of the application's static files
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
	console.log('Server listening on port ' + port);
});

// All requests to /api/* will be mapped to the routes/api file, which contains api-specific routes
app.use('/api', api);


// Redirect requests to /api and / to the documentation page
app.get('/api', (req, res, next) => {
	res.redirect('/apidoc');
});

app.get('/', (req, res, next) => {
	res.redirect('/apidoc');
});

/**
	END: SERVER CONFIGURATION SETTINGS
**/



// ------------------------------------------------------------------------------------------------------------------------ //

/**
	START: LIVEKITCHEN WITH WEBSOCKETS
**/

// Websockets setup
const io = socket(server);
// Dependences
const uuidv4 = require('uuid/v4');
const moment = require('moment');
// Models
const Orders = require('./models/Orders');
const Auth = require('./models/Auth');
const Sockets = require('./models/Sockets');

io.on('connection', (socket) => {
	console.log('Client "' + socket.id + '" connected.');
	const query = socket.handshake.query;
	const data = {socketId: socket.id}

	if(query.hasOwnProperty('restaurantId')) {
		data.restaurantId = query.restaurantId;
	} else if(query.hasOwnProperty('customerId')) {
		data.customerId = query.customerId;
	} else {
		// ToDO: Log to server, inform client
		console.log('customerId/restaurantId not found.');
		socket.disconnect();
	}

	Sockets.addSocket(data, (err, result) => {
		if(err) {
			// ToDO: Log to server, inform client
			console.log(err);
		} else {
			console.log('CONN: ' + result);
		}
	});

	// Note when a client disconnects
	socket.on('disconnect', function () {
		var type;
		console.log('Client "' + socket.id + '" disconnected.');
		if(query.hasOwnProperty('restaurantId')) {
			type = 'restaurant';
		} else if(query.hasOwnProperty('customerId')) {
			type = 'customer';
		} else {
			// ToDO: log to server
			console.log('customerId/restaurantId not found.');
			// ToDO: Inform client
			socket.disconnect();
		}

		Sockets.removeSocket(socket.id, type, (err, result) => {
			if(err) {
				// ToDO: log to server, inform client
				console.log(err);
			} else {
				console.log(result);
			}
		});
	});

	/**
		Listen to new orders sent by a customer
	**/
	socket.on('newOrder', (order) => {
		// Immediately set the unique orderId, and convert the UNIX timestamp to a DATETIME for the DB
		order.metaData.orderId = uuidv4();
		order.metaData.time = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');

		// Verify the auth token
		Auth.verifyToken(order.headers.token, (err, decodedpayload) => {
			if(err) {
				console.log(err);
				socket.disconnect(); // can we emit a message to the sender upon disconnection?
			} else {
				// Add the customer socket to the RestaurantCustomers table
				// **TODO: check that the below properties are provided in the order object**
				const socketData = {
					customerSocketId: socket.id,
					hostRestaurantId: order.metaData.restaurantId
				}

				Sockets.addSocketToRestaurantCustomers(socketData, (err, result) => {
					if(err) {
						// ToDO: log to server, inform client
						console.log(err);
					} else {
						// Store the order
						Orders.createNewOrder(order.metaData, order.items, (err, result) => {
							if(err) {
								console.log(err);
							} else {
								// Find all currently connected sockets representing the recipient retaurant
								Sockets.getRecipientRestaurantSockets(order.metaData.restaurantId, (err, result) => {
									if(err) {
										console.log(err);
									} else {
										if(result.length < 1) {
											console.log('restaurant not found');
										} else {
											// Unify the order metaData and order items as a single object
											order.metaData.status = Orders.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
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
											}
										}
									}
								});
							}
						});
					}
				});
			}
		});
	});

	/**
		Listen to order-status updates made by the restauraut, e.g. "accepted", "rejected", and "enroute"
	**/
	socket.on('orderStatusUpdate', (order) => {
		// Verify the auth token
		Auth.verifyToken(order.headers.token, (err, decodedpayload) => {
			if(err) {
				console.log(err);
				socket.disconnect();
			} else {
				order = order.metaData;
				Orders.updateOrderStatus(order.orderId, order.status, (err, result) => {
					if(err) {
						console.log(err);
					} else {
						// Check that at least one row was changed
						Orders.wasOrderUpdated(result);

						// Emit the order-status confirmation to the sender socket (the restaurant 
						// that sent the order-status update)
						socket.emit('orderStatusUpdated', {
							orderId: order.orderId, 
							status: order.status,
							userMsg: Orders.setStatusUpdateMsg(order.status)
						});
						

						// Retrieve all connected sockets associated with the recipient restaurant (who updated the order's status)
						Sockets.getRecipientRestaurantSockets(order.restaurantId, (err, result) => {
							if(err) {
								console.log(err);
							} else {
								if(result.length < 1) {
									console.log('restaurant not found');
								} else {
									// Emit order-status=update confirmation to all connected sockets representing the recipient restaurant
									for(i = 0; i < result.length; i++) {
										socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
											orderId: order.orderId, 
											status: order.status,
											userMsg: Orders.setStatusUpdateMsg(order.status)
										});
									}

									// Retrieve all connected sockets associated with the recipient customer (who placed the order)
									Sockets.getRecipientCustomerSockets(order.customerId, (err, result) => {
										if(err) {
											// ToDO: log to server, inform client
											console.log(err);
										} else {
											// Emit the order-status update to all connected sockets representing the recipient customer
											for(i = 0; i < result.length; i++) {
												socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
													orderId: order.orderId, 
													status: order.status,
													userMsg: Orders.setStatusUpdateMsg(order.status)
												});
											}
										}
									});
								}
							}
						});
					}
				});
			}
		});
	});
});

/**
	LiveKitchen functions
**/


// The following routes are used to demo and test the liveKitchen system
app.get('/mcdonalds', (req, res, next) => {
	res.render('mcdonalds');
});

app.get('/burgerking', (req, res, next) => {
	res.render('burgerking');
});

app.get('/customer1', (req, res, next) => {
	res.render('customer1');
});

app.get('/customer2', (req, res, next) => {
	res.render('customer2');
});

/**
	END: LIVEKITCHEN WITH WEBSOCKETS
**/