// Dependencies
// Config
const db = require('../config/database');

/**
	Get restaurant by owner (user) Id
**/
module.exports.getRestaurantById = function(userId, callback) {
	const query = 'SELECT * FROM restaurants WHERE OwnerId = ?';
	db.query(query, userId, callback);
}

/**
	Get the ID of the restaurant's owner
**/
module.exports.getRestaurantOwnerId = function(restaurantId, callback) {
	const query = 'SELECT ownerId FROM restaurants WHERE restaurantId = ?';
	db.query(query, restaurantId, callback);
}

/**
	Update a restaurant's details
**/
module.exports.updateRestaurantDetails = function(restaurantId, restaurantData, callback) {
	const query = 'UPDATE restaurants SET ? ' +
				  'WHERE restaurantId = ?';
	db.query(query, [restaurantData, restaurantId], callback);
}

/**
	Deactivate a restaurant
**/
module.exports.deactivateRestaurant = function(restaurantId, callback) {
	const query = 'UPDATE restaurants SET active = 0 WHERE restaurantId = ?';
	db.query(query, restaurantId, callback);
}

