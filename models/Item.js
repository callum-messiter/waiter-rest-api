const db = require('../config/database');
const e = require('../helpers/error').errors;

module.exports.getItemById = function(itemId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT itemId, name, price, description ' +
					  'FROM items ' + 
					  'WHERE itemId = ?';
		db.query(query, itemId, (err, items) => {
			if(err) return reject(err);
			resolve(items);
		});
	});
}

/**
	Get the userId of the item owner
**/
module.exports.getItemOwnerId = function(itemId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
					  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
					  'JOIN categories ON categories.menuId = menus.menuId ' +
					  'JOIN items ON items.categoryId = categories.categoryId ' +
					  'WHERE items.itemId = ?';
		db.query(query, itemId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

/**
	Get all active items belonging to a particular category
**/
module.exports.getAllItemsFromCategory = function(categoryId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT itemId, name, price, description ' +
					  'FROM items ' +
					  'WHERE categoryId = ? AND active = 1 ' +
					  'ORDER BY date';
		db.query(query, categoryId, (err, items) => {
			if(err) return reject(err);
			resolve(items);
		});
	});
}

/**
	Create a new item, assigned to a category
**/
module.exports.createNewItem = function(item) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO items SET ?';
		db.query(query, item, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

/**
	Update item details
**/
module.exports.updateItemDetails = function(itemId, itemData) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE items SET ? WHERE itemId = ?';
	    db.query(query, [itemData, itemId], (err, result) => {
	    	if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
	    });
	});
}

/**
	Deactivate item, so it will no longer be visible to the user, but recoverable in the future
**/
module.exports.deactivateItem = function(itemId) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE items SET active = 0 WHERE itemId = ?';
		db.query(query, itemId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.resourceAlreadyInactive);
			resolve(result);
		});
	});
}