const db = require('../config/database');

module.exports.schema = {
	itemId: '',
	categoryId: '',
	name: '',
	price: '',
	description: '',
	date: '',
	// The parameters that can be passed in the body of the request
	requestBodyParams: {
		name: '',
		price: '',
		description: '',
		categoryId: '',
	}
}

/**
	Create a new item, assigned to a category
**/
module.exports.createNewItem = function(item, callback) {
	// First add the categoryId (from the route) to the item object (sent in the body)
	const query = 'INSERT INTO items SET ?';
	db.query(query, item, callback);
}

module.exports.getItemById = function(itemId, callback) {
	const query = 'SELECT itemId, name, price, description FROM items WHERE itemId = ?';
	db.query(query, itemId, callback);
}

/**
	Deactivate item, so it will no longer be visible to the user, but recoverable in the future
**/
module.exports.deactivateItem = function(itemId, callback) {
	const query = 'UPDATE items SET active = 0 ' +
				  'WHERE itemId = ?';
	db.query(query, itemId, callback);
}

/**
	Update item details
**/
module.exports.updateItemDetails = function(itemId, itemData, callback) {
	const query = 'UPDATE items SET ? ' +
				  'WHERE itemId = ?';
    db.query(query, [itemData, itemId], callback);
}

/**
	Get the userId of the item owner
**/
module.exports.getItemOwnerId = function(itemId, callback) {
	const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
				  'JOIN categories ON categories.menuId = menus.menuId ' +
				  'JOIN items ON items.categoryId = categories.categoryId ' +
				  'WHERE items.itemId = ?';
	db.query(query, itemId, callback);
}

/**
	Get all items belonging to a particular category
**/
module.exports.getAllItemsFromCategory = function(categoryId, callback) {
	const query = 'SELECT itemId, name, price, description ' +
				  'FROM items ' +
				  'WHERE categoryId = ? ' +
				  'ORDER BY date';
	db.query(query, categoryId, callback);
}