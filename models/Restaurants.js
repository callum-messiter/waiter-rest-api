// Dependencies
const shortId = require('shortid');

// Config
const db = require('../config/database');

/**
	Get restaurant by owner (user) Id
**/
module.exports.getRestaurantByOwnerId = function(ownerId, callback) {
	const query = 'SELECT * FROM restaurants WHERE OwnerId = ?';
	db.query(query, ownerId, callback);
}

/**
	Get the ID of the restaurant's owner
**/
module.exports.getRestaurantId = function(restaurantId, callback) {
	const query = 'SELECT ownerId FROM restaurants WHERE restaurantId = ?';
	db.query(query, restaurantId, callback);
}

module.exports.createNewRestaurant = function(restaurant, callback) {
	const query = 'INSERT INTO restaurants SET ?';
	db.query(query, restaurant, callback);
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

/**
	Upon user registration, create the user's restaurant with a default menu
**/
module.exports.createRestaurantWithDefaultMenu = function(restaurant, menu, callback) {
	// Default categories
	const categories = [
		[shortId.generate(), 'Starters', menu.menuId],
		[shortId.generate(), 'Mains', menu.menuId],
		[shortId.generate(), 'Sides', menu.menuId],
		[shortId.generate(), 'Desserts', menu.menuId],
		[shortId.generate(), 'Drinks', menu.menuId]
	];

	// Queries
	const createRestaurant = 'INSERT INTO restaurants SET ?';
	const createMenu = 'INSERT INTO menus SET ?';
	const createCategory = 'INSERT INTO categories (categoryId, name, menuId) VALUES ?';
	
	db.query(createRestaurant, restaurant, (err, result) => {
		if(!err) {
			db.query(createMenu, menu, (err, result) => {
				if(!err) {
					db.query(createCategory, [categories], callback);
				} else {
					callback;
				}
			});
		} else {
			callback;
		}
	});
}

/**
	Get all restaurants, and later we will filter this result by location (vicitiny to user's location)
**/
module.exports.getNearbyRestaurants = function(callback) {
	const query = 'SELECT * FROM restaurants';
	db.query(query, callback);
}