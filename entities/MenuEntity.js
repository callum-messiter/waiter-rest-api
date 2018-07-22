const db = require('../config/database');
const e = require('../helpers/error').errors;


module.exports.getMenuByRestaurantId = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name FROM menus WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getMenuOwnerId = (menuId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  	  'JOIN menus on menus.restaurantId = restaurants.restaurantId ' +
				  	  'WHERE menus.menuId = ?';
		db.query(query, menuId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getMenuDetails = (menuId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menus.menuId, menus.name, restaurants.restaurantId, restaurants.name AS restaurantName ' +
					  'FROM menus ' +
					  'JOIN restaurants on restaurants.restaurantId = menus.restaurantId ' + 
					  'WHERE menuId = ?';
		db.query(query, menuId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getMenuCategories = (menuId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT categoryId, name ' + 
					  'FROM categories ' +
					  'WHERE menuId = ? ' +
					  'AND active = 1 ' +
					  'ORDER BY date DESC';
		db.query(query, menuId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getMenuItems = (menuId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price, items.description, items.categoryId ' + 
					  'FROM items ' +
					  'JOIN categories on categories.categoryId = items.categoryId ' +
					  'JOIN menus on menus.menuId = categories.menuId ' +
					  'WHERE categories.menuId = ? ' +
					  'AND items.active = 1 ' +
					  'ORDER BY items.date DESC';
		db.query(query, menuId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllMenus = () => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name, restaurantId ' + 
					  'FROM menus ' + 
					  'WHERE active = 1';
		db.query(query, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.createNewMenu = (menu) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO menus SET ?';
		db.query(query, menu, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateMenuDetails = (menuId, menuData) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE menus SET ? ' +
					  'WHERE menuId = ?';
		db.query(query, [menuData, menuId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.deactivateMenu = (menuId) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE menus SET active = 0 WHERE menuId = ?';
		db.query(query, menuId, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}