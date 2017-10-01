const express = require('express');
const router = express.Router();

router.post('/new/:restaurantId', (req, res, next) => {
	const restaurantId = req.params.restaurantId;
	const orderName = 'order-' + restaurantId;
	// Once an order is placed, and inserted into the database, we will emit the order through the socket to the LiveKitchen 
	const now = new Date().getTime();
	const order = {
		items: [
			{
				name: req.body.itemName,
				price: req.body.itemPrice,
				description: req.body.itemDescription
			}
		],
		totalPrice: 6.30,
		tableNumber: 16, 
		orderPlaced: now
	}
	// We want to send the message to a particular socket - the restaurant who is receiving the order: io.sockets.connected[socketid].emit();
	req.io.sockets.emit(orderName, order);
	// Or we could call the message the restaurant Id, and then have in the web app listening for the restaurantId too
});

module.exports = router;