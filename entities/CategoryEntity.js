const db = require('../config/database');
const e = require('../helpers/ErrorHelper').errors;
const ParamHelper = require('../helpers/ParamHelper');
const CategoryService = require('../services/CategoryService');

module.exports.getCategoryOwnerId = (categoryId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.ownerId FROM restaurants ' +
					  'LEFT JOIN menus ON menus.restaurantId = restaurants.restaurantId ' +
					  'LEFT JOIN categories ON categories.menuId = menus.menuId ' +
					  'WHERE categories.categoryId = ?';
		db.query(query, categoryId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});	
}

module.exports.getCategoryItems = (categoryId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT itemId, name, price, description FROM items WHERE categoryId = ?';
		db.query(query, categoryId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.createNewCategory = (data) => {
	return new Promise((resolve, reject) => {
		const category = {
			categoryId: data.categoryId,
			menuId: data.menuId,
			name: data.name,
			description: data.description,
			date: data.date,
			active: data.active
		}
		const query = 'INSERT INTO categories SET ?';
		db.query(query, category, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.updateCategory = (categoryId, data) => {
	return new Promise((resolve, reject) => {
		const ep = CategoryService.editableParams;
		const categoryObj = ParamHelper.buildObjBasedOnParams(data, ep);
		const query = 'UPDATE categories SET ? WHERE categoryId = ?'
		db.query(query, [categoryObj, categoryId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}