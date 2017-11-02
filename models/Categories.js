// Dependencies
// Config
const db = require('../config/database');

module.exports.schema = {
	categoryId: '',
	menuId: '',
	name: '',
	description: '',
	date: '',
	active: '',
	// The parameters that can be passed in the body of the request
	requestBodyParams: {
		name: '',
		description: ''
	}
}

/**
	Get the userId of the category owner
**/
module.exports.getCategoryOwnerId = function(categoryId, callback) {
	const query = 'SELECT restaurants.ownerId FROM restaurants ' +
				  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
				  'JOIN categories ON categories.menuId = menus.menuId ' +
				  'WHERE categories.categoryId = ?';
	db.query(query, categoryId, callback);
}

/**
	Get all items belonging to a category
**/
module.exports.getCategoryItems = function(categoryId, callback) {
	const query = 'SELEC itemId, name, price, description FROM items WHERE categoryId = ?';
	db.query(query, categoryId, callback);
}

/**
	Create new category that is assigned to the relevant menu
**/
module.exports.createNewCategory = function(category, callback) {
	// First add the menuId (from the route) to the category object (sent in the body)
	const query = 'INSERT INTO categories SET ?';
	db.query(query, category, callback);
}

/**
	Deactivate category, so it will no longer be visible to the user, but recoverable in the future
**/
module.exports.deactivateCategory = function(categoryId, callback) {
	const query = 'UPDATE categories SET active = 0 ' +
				  'WHERE categoryId = ?';
	db.query(query, categoryId, callback);
}

/**
	Update category details
**/
module.exports.updateCategoryDetails = function(categoryId, categoryData, callback) {
	const query = 'UPDATE categories SET ? ' +
				  'WHERE categoryId = ?'
	db.query(query, [categoryData, categoryId], callback);
}