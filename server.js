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

// Websockets setup
const io = socket(server);

/**
	END: SERVER CONFIGURATION SETTINGS
**/



// ------------------------------------------------------------------------------------------------------------------------ //
const Orders = require('./models/Orders');


/**
	START: LIVEKITCHEN WITH WEBSOCKETS
**/

// Expose the io object to all routes via the req object
/**
app.use((req, res, next) => {
	req.io = io;
	next();
});
**/

io.on('connection', (socket) => {

	// Note when a new client connects
	console.log('Client "' + socket.id + '" connected.');
	
	// Listen for new orders placed by the diner
	socket.on('newOrder', (order) => {
		// Verify order.headers.token
		console.log('Server received an order from ' + order.userId);
		/** 
			1) The customer (iOS client) has sent a new order to the server: now get the details
		**/
		const userId = order.userId;
		const restaurantId = order.restaurantId;
		const orderName = 'order-' + restaurantId;

		/** 
			2) All logic which would be in the order controller will be located here
				a) Add order to the database
				b) Process the transaction
		**/
		Orders.storeOrder(order, (err, result) => {
			if(err) {
				console.log(err);
			} else {
				/**
					3) Create and join a room that is created exclusively for this customer and the recipient restaurant 
					(the restaurant will join the room later)
				**/
				const roomName = 'transaction-'+userId+'-'+restaurantId;
				socket.join(roomName);
				/** 
					4) Emit the order to the kitchen (web app). The web app will listen to events whose name == said restaurant's ID
				**/
				socket.broadcast.emit(orderName, order);
				console.log('New room created: "' +roomName+ '".');
				console.log(io.sockets.adapter.rooms); // Room { sockets: { 'dDv-s07qFkbz3aEXAAAA': true }, length: 1 }
				/**
					5) Once the order is sent, update the order status in the db
						a) We must generate a random orerId before inserting it into the db
						b) then once the order is sent to the kitchen, we can use this unique id to query the db and update its status
				**/
				orderId = 1; // hard code this for now, for testing
				Orders.updateOrderStatus(orderId, 200, (err, result) => {
					if(err) {
						console.log(err);
					} else {
						console.log('Order status updated!');
					}
				});
			}
		});
	});

	// Listen to order-status updates made by the restauraut
	socket.on('orderStatusUpdate', (status) => {
		// Update the status in the database

		/** 
			4) Look for the restaurant-customer specific room,  and join it 
			(the other member will be a customer who has placed an order with the restaurant)
		**/ 
		const userId = status.userId;
		const restaurantId = status.restaurantId;
		const roomName = 'transaction-'+userId+'-'+restaurantId;

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
			Upon receiving the new status, The iOS client should push a notification to the customer 
		**/
		socket.broadcast.to(roomName).emit('newStatus', status); 
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