// Dependencies
const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
// Models
const Orders = require('../models/Orders');
const Auth = require('../models/Auth');
const Restaurants = require('../models/Restaurants');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');

router.get('/getAllLive/:restaurantId', (req, res, next) => {
	const restaurantId = req.params.restaurantId;
	Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
		if(err) {
			ResponseHelper.sql(res, 'getRestaurantOwnerId', err);
		} else if(result.length < 1) {
			ResponseHelper.resourceNotFound(res, 'restaurant');
		} else {
			const ownerId = result[0].ownerId;
			const requesterId = res.locals.authUser.userId;
			// Menus can only be modified by the menu owner
			if(requesterId != ownerId) {
				ResponseHelper.unauthorised(res, 'restaurant');
			} else {
				// All orders that are at the restaurant level of the "circuit", e.g. sentToKitchen, receivedByKitchen, accepted
				Orders.getAllLiveOrdersForRestaurant(restaurantId, (err, orders) => {
					if(err) {
						ResponseHelper.sql(res, 'getAllLiveOrdersForRestaurant', err);
					} else {
						if(orders.length < 1) {
							// If there are no live orders, send an empty array
							ResponseHelper.customSuccess(res, 200, []);
						} else {
							// Add an empty items array to all the live orders
							for(i = 0; i < orders.length; i++) {
								orders[i].items = [];
							}

							Orders.getItemsFromLiveOrders(restaurantId, (err, orderItems) => {
								if(err) {
									ResponseHelper.sql(res, 'getItemsFromLiveOrders', err);
								} else {
									if(orderItems.length < 1) {
										// If there are no orderItems (weird), send the orders array
										ResponseHelper.customSuccess(res, 200, orders);
									} else {
										// Loop through the orderitems and assign them to their order
										orderItems.forEach(function(item) {
											const newItem = {itemId: item.itemId, name: item.name}
											orders.forEach(function(order) {
												// If there is an order with the item's orderId, add the item to this order's array of items
												if(item.orderId == order.orderId) {
													order.items.push(newItem);
												}
											});
										});
										ResponseHelper.customSuccess(res, 200, orders);
									}
								}
							});
						}
					}
				});
			}
		}
	});
});

module.exports = router;