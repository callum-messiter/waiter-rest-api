// Dependencies
// Config
const db = require('../config/database');

module.exports.getCategoryOwner = function(categoryId, callback) {
	const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
				  'JOIN categories ON categories.menuId = menus.menuId ' +
				  'WHERE categories.categoryId = ?';
	db.query(query, categoryId, callback);
}