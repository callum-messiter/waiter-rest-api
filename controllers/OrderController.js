const router = require('express').Router();
const Order = require('../models/Order');
const Auth = require('../models/Auth');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const roles = require('../models/UserRoles').roles;
const e = require('../helpers/error').errors;
const p = require('../helpers/params');

const Payment = require('../models/Payment');
router.get('/test', (req, res, next) => testAsync(req, res, next) );
async function testAsync(req, res, next) {
	const orderId = 'HypsuMoJX';

	var result = await Payment.async.getOrderPaymentDetails(orderId);
	if(result.error) return next(result.error);
	
	result = await Payment.async.processCustomerPaymentToRestaurant(result.data[0]);
	if(result.error) return next(result.error);
	
	result = await Payment.async.updateChargeDetails(orderId, {
		chargeId: charge.id,
		paid: 1
	});

	if(result.error) return next(result.error);

	result = await Order.async.updateOrderStatus(order.orderId, Order.statuses.paymentSuccessful);
	if(result.error) return next(result.error);
	res.status(200).json(result.data);
}

async function restaurantAcceptedOrder(order) {
	/* Each one of these methods must return an object containing an error property, which we will check */
	const details = await Payment.async.getOrderPaymentDetails(order.orderId);
	const charge = await Payment.async.processCustomerPaymentToRestaurant(details[0]);
	const chargeUpdate = await Payment.async.updateChargeDetails(order.orderId, {chargeId: charge.id, paid: 1});
	const statusUpdate = await Order.async.updateOrderStatus(order.orderId, Order.statuses.paymentSuccessful);
	const sockets = await LiveKitchen.async.getAllInterestedSockets(order.restaurantId, order.customerId);
	// Emit orderStatusUpdated event to all relevant clients
}

// TODO: only use route parameters that refer specifically to the desired resource (e.g. to get a specific order, use the orderId)
router.get('/getAllLive/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;

	Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions
		return Order.getAllLiveOrdersForRestaurant(restaurantId);

	// TODO: retrieving orders, then the order items, then building the object, should be done with one query
	}).then((o) => {

		// Add an empty items array to all the live orders
		res.locals.orders = [];
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

router.get('/list/:restaurantId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: ['restaurantId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	const restaurantId = req.params.restaurantId;
	return Restaurant.getRestaurantOwnerId(restaurantId)
	.then((r) => {

		if(r.length < 1) throw e.restaurantNotFound;
		if(!Auth.userHasAccessRights(u, r[0].ownerId)) throw e.insufficientPermissions;
		return Order.getAllOrdersForRestaurant(restaurantId);

	}).then((orders) => {

		/* Add an empty items array to all the live orders */
		res.locals.orders = [];
		for(var order of orders) { order.items = [] };
		res.locals.orders = JSON.parse(JSON.stringify(orders));
		return Order.getItemsFromRestaurantOrders(restaurantId);

	}).then((items) => {

		const orders = res.locals.orders;
		if(orders.length < 1) return res.status(200).json({});
		if(items.length < 1) return res.status(200).json(orders);
		assignItemsToOrder(items, orders); /* Assign items to their respective orders */
		return res.status(200).json(orders);

	}).catch((err) => {
		return next(err);
	});
});

router.get('/live/:orderId', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: ['orderId']
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	Order.getOrderOwnerId(req.params.orderId)
	.then((o) => {

		if(o.length < 1) throw e.orderNotFound;
		if(!Auth.userHasAccessRights(u, o[0].customerId)) throw e.insufficientPermissions;
		return Order.getLiveOrder(req.params.orderId);

	}).then((order) => {

		res.locals.order = [];
		if(order.length > 0) {
			res.locals.order = JSON.parse(JSON.stringify(order[0]));
			return Order.getItemsFromLiveOrder(req.params.orderId);
		}
		return true;

	}).then((i) => {

		if(i.length > 0) {
			res.locals.order.items = [];
			i.forEach((item) => {
				item = JSON.parse(JSON.stringify(item));
				res.locals.order.items.push(item);
			});
		}
		// TODO: this is a quick hack; should be retrieved at an earlier point by the customer app
		// Get the restaurant name for the customer app
		return Restaurant.getRestaurantById(res.locals.order.restaurantId);

	}).then((r) => {

		return res.status(200).json({ 
			order: res.locals.order, 
			restaurantName: r[0].name 
		});

	}).catch((err) => {
		return next(err);
	});
});

router.get('/history', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;

	/**
	 * The userId param should only be provided if the requester wants to retrieve another user's orders.
	 * Only admins can do this. If the user wishes to retrieve his own team boxes, this parameter is 
	 * unecessary and will be ignored; the API will use the userId of the requester.
	 */
	const ordersOwnerId = req.query.userId || u.userId;

	// Check the user exists
	User.getUserById(ordersOwnerId)
	.then((users) => {

		if(users.length < 1) throw e.userNotFound;
		if(!Auth.userHasAccessRights(u, ordersOwnerId)) throw e.insufficientPermissions;
		return Order.getOrdersForUser(ordersOwnerId);

	}).then((o) => {
		return res.status(200).json(o);
	}).catch((err) => {
		return next(err);
	});

});

/* TODO: refactor this mess */
router.get('/historyV2', (req, res, next) => {
	const u = res.locals.authUser;

	const allowedRoles = [roles.diner, roles.restaurateur, roles.waitrAdmin];
	if(!Auth.userHasRequiredRole(u.userRole, allowedRoles)) throw e.insufficientRolePrivileges;
	
	const requiredParams = {
		query: [],
		body: [],
		route: []
	}
	if(p.paramsMissing(req, requiredParams)) throw e.missingRequiredParams;
	const ordersOwnerId = req.query.userId || u.userId;

	/* Check the user exists */
	User.getUserById(ordersOwnerId)
	.then((users) => {

		if(users.length < 1) throw e.userNotFound;
		if(!Auth.userHasAccessRights(u, ordersOwnerId)) throw e.insufficientPermissions;
		return Order.getAllOrdersForUser(ordersOwnerId);

	}).then((orders) => {

		/* Add an empty items array to all the live orders */
		res.locals.orders = [];
		for(var order of orders) { order.items = [] };
		res.locals.orders = JSON.parse(JSON.stringify(orders));
		return Order.getItemsFromUserOrders(ordersOwnerId);

	}).then((items) => {

		const orders = res.locals.orders;
		if(orders.length < 1) return res.status(200).json({});
		if(items.length < 1) return res.status(200).json(orders);
		assignItemsToOrder(items, orders); /* Assign items to their respective orders */
		return res.status(200).json(orders);

	}).catch((err) => {
		return next(err);
	});
});

function assignItemsToOrder(items, orders) {
	for(var item of items) {
		const newItem = { itemId: item.itemId, name: item.name, price: item.price };
		for(var order of orders) {
			// If there is an order with the item's orderId, add the item to this order's array of items
			if(item.orderId == order.orderId) {
				order.items.push(newItem);
			}
		}
	}
}

module.exports = router;