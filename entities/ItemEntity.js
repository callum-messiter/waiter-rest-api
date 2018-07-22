const db = require('../config/database');
const e = require('../helpers/error').errors;

module.exports.getItemById = (itemId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT itemId, name, price, description ' +
					  'FROM items ' + 
					  'WHERE itemId = ?';
		db.query(query, itemId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getItemOwnerId = (itemId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
					  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
					  'JOIN categories ON categories.menuId = menus.menuId ' +
					  'JOIN items ON items.categoryId = categories.categoryId ' +
					  'WHERE items.itemId = ?';
		db.query(query, itemId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllItemsFromCategory = (categoryId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT itemId, name, price, description ' +
					  'FROM items ' +
					  'WHERE categoryId = ? AND active = 1 ' +
					  'ORDER BY date';
		db.query(query, categoryId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.createNewItem = (item) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO items SET ?';
		db.query(query, item, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateItemDetails = (itemId, data) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE items SET ? WHERE itemId = ?';
	    db.query(query, [data, itemId], (err, result) => {
	    	if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
	    });
	});
}

module.exports.deactivateItem = (itemId) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE items SET active = 0 WHERE itemId = ?';
		db.query(query, itemId, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}