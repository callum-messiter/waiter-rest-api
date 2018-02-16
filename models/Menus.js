// Config
const db = require('../config/database');

/**
	Get the menu details
**/
module.exports.getMenuDetails = function(menuId, callback) {
	const query = 'SELECT menus.menuId, menus.name, restaurants.restaurantId, restaurants.name AS restaurantName ' +
				  'FROM menus ' +
				  'JOIN restaurants on restaurants.restaurantId = menus.restaurantId ' + 
				  'WHERE menuId = ?';
	db.query(query, menuId, callback);
}

/**
	Get menu by referencing the ID of the restaurant to which it belongs
**/
module.exports.getMenuByRestaurantId = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name FROM menus WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, menu) => {
			if(err) return reject(err);
			resolve(menu);
		});
	});
}

/**
	Get all cateories belonging to a menu
**/
module.exports.getMenuCategories = function(menuId, callback) {
	const query = 'SELECT categoryId, name ' + 
				  'FROM categories ' +
				  'WHERE menuId = ? ' +
				  'AND active = 1 ' +
				  'ORDER BY date DESC';
	db.query(query, menuId, callback);
}

/**
	Get an entire menu by ID; includes all categories and items
**/
module.exports.getMenuItems = function(menuId, callback) {
	const query = 'SELECT items.itemId, items.name, items.price, items.description, items.categoryId ' + 
				  'FROM items ' +
				  'JOIN categories on categories.categoryId = items.categoryId ' +
				  'JOIN menus on menus.menuId = categories.menuId ' +
				  'WHERE categories.menuId = ? ' +
				  'AND items.active = 1 ' +
				  'ORDER BY items.date DESC';
	db.query(query, menuId, callback);
}

/**
	Get the userId of the menu owner by passing the menuId
**/
module.exports.getMenuOwnerId = function(menuId, callback){
	const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  'JOIN menus on menus.restaurantId = restaurants.restaurantId ' +
				  'WHERE menus.menuId = ?';
	db.query(query, menuId, callback);
}

/**
	Create new menu, assigned to a restaurant
**/
module.exports.createNewMenu = function(menu, callback) {
	// First add the restaurantId (from the route) to the menu object (sent in the body)
	const query = 'INSERT INTO menus SET ?';
	db.query(query, menu, callback);
}

/**
	Deactivate menu, such that it is no longer visible to the user, but is recoverable 
**/
module.exports.deactivateMenu = function(menuId, callback) {
	const query = 'UPDATE menus SET active = 0 WHERE menuId = ?';
	db.query(query, menuId, callback);
}

/**
	Update menu details
**/
module.exports.updateMenuDetails = function(menuId, menuData, callback) {
	const query = 'UPDATE menus SET ? ' +
				  'WHERE menuId = ?';
	db.query(query, [menuData, menuId], callback);
}

module.exports.getAllMenus = function(callback) {
	const query = 'SELECT menuId, name, restaurantId FROM menus';
	db.query(query, callback);
}