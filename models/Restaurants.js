// Dependencies
// Config
const db = require('../config/database');

/**
	Get restaurant by owner (user) Id
**/
module.exports.getRestaurantDetails = function(userId, callback) {
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

module.exports.createNewRestaurant = function(userId, restaurant, callback) {
	// First add the userId to the restaurant object
	restaurant.ownerId = userId;
	const query = 'INSERT INTO restaurants SET ?';
	db.query(query, restaurant, callback);
}