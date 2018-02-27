const db = require('../config/database');
const e = require('../helpers/error').errors;

/**
	Get the menu details
**/
module.exports.getMenuDetails = function(menuId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menus.menuId, menus.name, restaurants.restaurantId, restaurants.name AS restaurantName ' +
					  'FROM menus ' +
					  'JOIN restaurants on restaurants.restaurantId = menus.restaurantId ' + 
					  'WHERE menuId = ?';
		db.query(query, menuId, (err, menuDetails) => {
			if(err) return reject(err);
			resolve(menuDetails);
		});
	});
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
module.exports.getMenuCategories = function(menuId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT categoryId, name ' + 
					  'FROM categories ' +
					  'WHERE menuId = ? ' +
					  'AND active = 1 ' +
					  'ORDER BY date DESC';
		db.query(query, menuId, (err, categories) => {
			if(err) return reject(err);
			resolve(categories);
		});
	});
}

/**
	Get an entire menu by ID; includes all categories and items
**/
module.exports.getMenuItems = function(menuId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price, items.description, items.categoryId ' + 
					  'FROM items ' +
					  'JOIN categories on categories.categoryId = items.categoryId ' +
					  'JOIN menus on menus.menuId = categories.menuId ' +
					  'WHERE categories.menuId = ? ' +
					  'AND items.active = 1 ' +
					  'ORDER BY items.date DESC';
		db.query(query, menuId, (err, items) => {
			if(err) return reject(err);
			resolve(items);
		});
	});
}

/**
	Get the userId of the menu owner by passing the menuId
**/
module.exports.getMenuOwnerId = function(menuId){
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
					  'JOIN menus on menus.restaurantId = restaurants.restaurantId ' +
					  'WHERE menus.menuId = ?';
		db.query(query, menuId, (err, ownerId) => {
			if(err) return reject(err);
			resolve(ownerId);
		});
	});
}

module.exports.getAllMenus = function() {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name, restaurantId ' + 
					  'FROM menus ' + 
					  'WHERE active = 1';
		db.query(query, (err, menus) => {
			if(err) return reject(err);
			resolve(menus);
		});
	});
}

/**
	Create new menu, assigned to a restaurant
**/
module.exports.createNewMenu = function(menu) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO menus SET ?';
		db.query(query, menu, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

/**
	Update menu details
**/
module.exports.updateMenuDetails = function(menuId, menuData) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE menus SET ? ' +
					  'WHERE menuId = ?';
		db.query(query, [menuData, menuId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}

/**
	Deactivate menu, such that it is no longer visible to the user, but is recoverable 
**/
module.exports.deactivateMenu = function(menuId) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE menus SET active = 0 WHERE menuId = ?';
		db.query(query, menuId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.resourceAlreadyInactive);
			resolve(result);
		});
	});
}