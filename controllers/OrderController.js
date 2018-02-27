const router = require('express').Router();
const Order = require('../models/Order');
const Auth = require('../models/Auth');
const Restaurant = require('../models/Restaurant');
const e = require('../helpers/error').errors;

// TODO: only use route parameters that refer specifically to the desired resource (e.g. to get a specific order, use the orderId)
router.get('/getAllLive/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	if(req.params.restaurantId == undefined) throw e.missingRequiredParams;
	const restaurantId = req.params.restaurantId;

	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions
		return Order.getAllLiveOrdersForRestaurant(restaurantId);

	// TODO: retrieving orders, then the order items, then building the object, should be done with one query
	}).then((o) => {

		// Add an empty items array to all the live orders
		if(o.length > 0) {
			for(i = 0; i < o.length; i++) {
				o[i].items = [];
			}
			res.locals.orders = JSON.parse(JSON.stringify(o));
			return Order.getItemsFromLiveOrders(restaurantId);
		}
		return true;

	}).then((i) => {

		const orders = res.locals.orders;
		if(orders.length < 1) return res.status(200).json({ data: {} });
		if(i.length < 1) return res.status(200).json({ data: orders });
		// Loop through the orderitems and assign them to their order
		i.forEach((item) => {
			const newItem = {itemId: item.itemId, name: item.name}
			orders.forEach((order) => {
				// If there is an order with the item's orderId, add the item to this order's array of items
				if(item.orderId == order.orderId) {
					order.items.push(newItem);
				}
			});
		});
		return res.status(200).json({ data: orders });

	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;