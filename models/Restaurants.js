// Dependencies
const shortId = require('shortid');

// Config
const db = require('../config/database');

/**
	Get restaurant by owner (user) Id
**/
module.exports.getRestaurantByOwnerId = function(ownerId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM restaurants WHERE ownerId = ?';
		db.query(query, ownerId, (err, restaurant) => {
			if(err) return reject(err);
			resolve(restaurant);
		});
	});
}

/**
	Get the ID of the restaurant's owner
**/
module.exports.getRestaurantOwnerId = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT ownerId FROM restaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
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
module.exports.getAllRestaurants = function(callback) {
	const query = 'SELECT restaurantId, name FROM restaurants ' + 
				  'WHERE active = 1';
	db.query(query, callback);
}

/**
	Get all the menus of a specific restaurant
**/
module.exports.getMenusForRestaurant = function(restaurantId, callback) {
	const query = 'SELECT menuId, name, restaurantId FROM menus ' + 
				  'WHERE restaurantId = ? ' +
				  'AND active = 1';
	db.query(query, restaurantId, callback);
}