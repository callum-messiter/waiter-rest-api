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
// Models
const Orders = require('./models/Orders');
const Auth = require('./models/Auth');

io.on('connection', (socket) => {
	// Note when a new client connects
	console.log('Client "' + socket.id + '" connected.');
	
	// Listen for new orders placed by the diner
	socket.on('newOrder', (order) => {
		order.data.orderId = uuidv4();
		/**
			0) Verify order.headers.token
		**/
		const token = order.headers.token;
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				// Log the error, and disconnect the client
				console.log('TOKEN IS DODGY');
				socket.disconnect();
			} else {
				console.log('Server received an order from ' + order.data.customerId + '. \r\n' + JSON.stringify(order));
				/** 
					1) The customer (iOS client) has sent a new order to the server: now get the details
				**/

				// Verify the price of the items by retrieving them from the database (user each itemId)

				// Construct the order object to be passed to the query ( we don't want to pass the items to the query)
				const orderData = {
					orderId: order.data.orderId,
					customerId: order.data.customerId,
					restaurantId: order.data.restaurantId,
					price: order.data.price
				};

				// The customerId and restaurantId are needed to create the exlusive customer-restaurant WebSockets channel (room)
				const customerId = orderData.customerId;
				const restaurantId = orderData.restaurantId;
				// The recipient restaurant will be listening for events following this naming convention
				const orderName = 'order_' + restaurantId; // Use the restaurantId so that restaurants only listen for their own orders
				/** 
					2) Add the order to the database	
				**/
				
				Orders.storeOrder(orderData, (err, result) => {
					if(err) {
						console.log(err);
					} else {
						/**
							3) Create and join a room that is created exclusively for this customer and the recipient restaurant 
							(the restaurant will join the room later)
						**/
						const roomName = 'transaction-'+customerId+'-'+restaurantId;
						socket.join(roomName);
						/** 
							4) Emit the order to all other connected sockets. The web app will listen to events 
							whose name == said restaurant's ID. This way restaurants will only receive orders intended
							for them
						**/
						console.log('ORDER NAME: ' + orderName);
						console.log('ORDER: ' +JSON.stringify(orderData));
						socket.broadcast.emit(orderName, order.data); // pass in the original order.data object which contains the items
						console.log('New room created: "' +roomName+ '".');
						console.log(io.sockets.adapter.rooms); // Room { sockets: { 'dDv-s07qFkbz3aEXAAAA': true }, length: 1 }
						/**
							5) Once the order is sent to the kitchen, update the order status in the db
								a) We generate a random orerId before inserting it into the db
								b) then once the order is sent to the kitchen, we can use this unique id to query the db and update the order's status to "sent"
						**/
						const orderId = order.data.orderId;
						const newStatus = Orders.statuses.sentToKitchen;
						console.log("STATUS-UPDATE, NEW STATUS: " + newStatus);
						Orders.updateOrderStatus(orderId, newStatus, (err, result) => {
							if(err) {
								console.log(err);
							} else {
								// Check that at least one row was changed
								Orders.wasOrderUpdated(result);
								console.log(result);
							}
						});
					}
				});
			}
		});
	});

	// Listen to order-status updates made by the restauraut
	socket.on('orderStatusUpdate', (status) => {
		/** 
			4) Look for the restaurant-customer specific room that was created when the server received
			the customer's order. Now add the restaurant (which has sent the status update) to this room, so
			that the customer and restaurant can communicate in a private channel of their own
		**/ 
		const orderId = status.orderId;
		const customerId = status.customerId;
		const restaurantId = status.restaurantId;
		const roomName = 'transaction-'+customerId+'-'+restaurantId;

		/**
			5) First check if this socket is already a part of the room
		**/
		if(io.sockets.adapter.rooms[roomName] != undefined) {
			console.log([roomName] + ' exists');
		} else {
			console.log([roomName] + ' does not exist');
		}
		socket.join(roomName);
		console.log(io.sockets.adapter.rooms);

		/**
			6) Emit the new order status to the rest of the room [e.g the single customer (iOS client)]
			Upon receiving the new status, The iOS client should push a notification to the customer.

			The web-app client (restaurant) will use the order.statuses object, and send the status code.
			We will pass it directly to the query, without having to set the status ourselves as we do below
		**/
		const newStatus = Orders.statuses.acceptedByKitchen;
		console.log("STATUS-UPDATE, NEW STATUS: " + newStatus);
		Orders.updateOrderStatus(orderId, newStatus, (err, result) => {
			if(err) {
				console.log(err);
			} else {
				// Check that at least one row was changed
				Orders.wasOrderUpdated(result);
				console.log(result);
				socket.broadcast.to(roomName).emit('newStatus', status.status); 
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