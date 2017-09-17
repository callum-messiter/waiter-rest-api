// Dependencies
// Config
const db = require('../config/database');

module.exports.schema = {
	categoryId: '',
	menuId: '',
	name: '',
	description: '',
	date: '',
	// The parameters that can be passed in the body of the request
	requestBodyParams: {
		name: '',
		description: ''
	}
}

/**
	Get the userId of the category owner
**/
module.exports.getCategoryOwner = function(categoryId, callback) {
	const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
				  'JOIN categories ON categories.menuId = menus.menuId ' +
				  'WHERE categories.categoryId = ?';
	db.query(query, categoryId, callback);
}

module.exports.createNewCategory = function(menuId, category, callback) {
	// First add the menuId (from the route) to the category object (sent in the body)
	category.menuId = menuId;
	const query = 'INSERT INTO categories SET ?';
	db.query(query, category, callback);
}