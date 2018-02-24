// Config
const db = require('../config/database');
const e = require('../helpers/error').errors;
/**
	Get the userId of the category owner
**/
module.exports.getCategoryOwnerId = function(categoryId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
					  'JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
					  'JOIN categories ON categories.menuId = menus.menuId ' +
					  'WHERE categories.categoryId = ?';
		db.query(query, categoryId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
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
module.exports.createNewCategory = function(category) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO categories SET ?';
		db.query(query, category, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

/**
	Deactivate category, so it will no longer be visible to the user, but recoverable in the future
**/
module.exports.deactivateCategory = function(categoryId) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE categories SET active = 0 ' +
					  'WHERE categoryId = ?';
		db.query(query, categoryId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.resourceAlreadyInactive);
			resolve(result);
		});
	});
}

/**
	Update category details
**/
module.exports.updateCategoryDetails = function(categoryId, categoryData) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE categories SET ? ' +
					  'WHERE categoryId = ?'
		db.query(query, [categoryData, categoryId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}