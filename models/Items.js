const db = require('../config/database');

/**
	item: {
		itemId: itemId,
		categoryId: categoryId,
		name: name,
		price: price,
		description: description,
		date: date
	}
**/
module.exports.createNewItem = function(item, callback) {
	const query = 'INSERT INTO items SET ?';
	db.query(query, item, callback);
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
module.exports.updateItemDetails = function(itemDetails, callback) {
	const query = 'UPDATE items SET ? ' +
				  'WHERE itemId = ?';
    db.query(query, itemDetails, itemId, callback);
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