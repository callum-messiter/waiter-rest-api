// Dependencies
// Config
const db = require('../config/database');

/**
	Get an entire menu by ID; includes all categories and items
**/
module.exports.getMenuById = function(menuId, callback) {
	const query = '';
	db.query(query, menuId, callback);
}

module.exports.getMenuOwnerId = function(menuId, callback){
	// Select restaurantId from menus where menuId = menuId
	// Select ownerId from restaurants where menuId = getMenuById
	const query = "SELECT restaurants.ownerId FROM restaurants LEFT JOIN menus on menus.restaurantId = restaurants.restaurantId WHERE menus.menuId = ?";
	db.query(query, menuId, callback);
}