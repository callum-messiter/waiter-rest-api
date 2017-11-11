// Dependencies
const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
// Models
const Orders = require('../models/Orders');
// Config
const secret = require('../config/jwt').secret;
const ResponseHelper = require('../helpers/ResponseHelper');

router.get('/test', (req, res, next) => {
	const restaurantId = 'SkxjHgNYRb';
	Orders.getAllLiveOrdersForRestaurant(restaurantId, (err, orders) => {
		if(err) {
			ResponseHelper.sql(res, 'getAllLiveOrdersForRestaurant', err);
		} else {
			Orders.getItemsFromLiveOrders(restaurantId, (err, orderItems) => {
				if(err) {
					ResponseHelper.sql(res, 'getItemsFromLiveOrders', err);
				} else {
					// Loop through the orderitems and assign them to their order
					orderItems.forEach(function(item) {
						const newItem = {itemId: item.itemId, name: item.name}
						orders.forEach(function(order) {
							// If there is an order with the item's orderId, add the item to this order's array of items
							if(item.orderId == order.orderId) {
								(order.items) ? order.items.push(newItem) : order.items = [newItem];
							}
						});
					});
					res.json(orders);
				}	
			});
		}
	});
});

module.exports = router;