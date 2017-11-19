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

io.on('connection', (socket) => {
	console.log('Client "' + socket.id + '" connected.');
	
	socket.on('newOrder', (order) => {
		// Immediately set the unique orderId, and convert the UNIX timestamp to a DATETIME for the DB
		order.metaData.orderId = uuidv4();
		order.metaData.time = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');
		
		// Verify the auth token
		Auth.verifyToken(order.headers.token, (err, decodedpayload) => {
			if(err) {
				console.log(err);
				socket.disconnect();
			} else {
				// Create the restaurant-specific event name, such that only the recipient restaurant will listen for it
				const eventName = 'order_'+order.metaData.restaurantId; 

				// Store the order, and the order items
				Orders.createNewOrder(order.metaData, order.items, (err, result) => {
					if(err) {
						console.log(err);
					} else {
						// Create a room exclusively for the specific customer and the specific restaurant
						const roomName = 'transaction-'+order.metaData.customerId+'-'+order.metaData.restaurantId;
						socket.join(roomName);

						// Unify the order metaData and order items as a single object, and emit the order to the restaurant
						const orderForRestaurant = order.metaData;
						orderForRestaurant.items = order.items;
						order.metaData.status = Orders.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
						socket.broadcast.emit(eventName, orderForRestaurant);

						// Once the event has been emitted, update the status of the order to 'sentToKitchen'
						Orders.updateOrderStatus(order.metaData.orderId, Orders.statuses.sentToKitchen, (err, result) => {
							if(err) {
								console.log(err);
							} else {
								Orders.wasOrderUpdated(result);
							}
						});
					}
				});
			}
		});
	});

	// Listen to order-status updates made by the restauraut
	socket.on('orderStatusUpdate', (order) => {
		/** 
			4) Look for the restaurant-customer specific room that was created when the server received
			the customer's order. Now add the restaurant (which has sent the order update) to this room, so
			that the customer and restaurant can communicate in a private channel of their own
		**/ 
		const roomName = 'transaction-'+order.customerId+'-'+order.restaurantId;

		/**
			5) First check if this socket is already a part of the room
		**/
		if(io.sockets.adapter.rooms[roomName] != undefined) {
			console.log('[4]: ' + [roomName] + ' exists');
		} else {
			console.log('[4]: ' + [roomName] + ' does not exist');
		}
		socket.join(roomName);
		console.log('[5] ROOMS: ' + io.sockets.adapter.rooms);

		/**
			6) The web-app client (restaurant) will use the order.statuses object, and send the status code. We will update the order's
			status in the database.

			Then, we first want to inform the restaurant (the sender socket) that the status update they sent has been received by the server,
			and the status of the order has been updated in the database accordingly. Then the client-side state will be updated.

			Then, Emit the new order status to the rest of the room [e.g the single customer (iOS client)]
			Upon receiving the new status, The iOS client should push a notification to the customer.
		**/
		console.log("[6]: STATUS-UPDATE, NEW STATUS: " + order.status);
		Orders.updateOrderStatus(order.orderId, order.status, (err, result) => {
			if(err) {
				console.log(err);
			} else {
				// Check that at least one row was changed
				Orders.wasOrderUpdated(result);
				// Send confirmation to the kitchen of the order-status update (so it can update the client-side state)
				socket.emit('orderStatusUpdated', {
					orderId: order.orderId, 
					customerId: order.customerId,
					restaurantId: order.restaurantId, 
					status: order.status
				});
				if(io.sockets.adapter.rooms[roomName].length > 1) {
					// Then broadcast the status update to the room, to inform the customer (iOS client)
				}
			}
		});

		/**
			7) Process the transaction
		**/
	});

	// Note when a client disconnects
	socket.on('disconnect', function () {
		console.log('Client "' + socket.id + '" disconnected.');	
	});
});

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