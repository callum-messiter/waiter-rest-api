const RestaurantService = require('../services/RestaurantService');
const ParamHelper = require('../helpers/ParamHelper');
const shortId = require('shortid');
const db = require('../config/database');
const e = require('../helpers/ErrorHelper').errors;

module.exports.getRestaurantByOwnerId = (ownerId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM restaurants WHERE ownerId = ?';
		db.query(query, ownerId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRestaurantById = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM restaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRestaurantOwnerId = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT ownerId FROM restaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllRestaurants = () => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurants.restaurantId, restaurants.name FROM restaurants ' +
					  'LEFT JOIN restaurantdetailspayment ON restaurantdetailspayment.restaurantId = restaurants.restaurantId ' +
					  'WHERE restaurants.active = 1 AND restaurantdetailspayment.isVerified = 1';
		db.query(query, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getMenusForRestaurant = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name, restaurantId ' + 
					  'FROM menus ' + 
					  'WHERE restaurantId = ? AND active = 1';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRestaurantDetails = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT `key`, `value` ' +
					  'FROM restaurantdetails ' +
					  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.createNewRestaurant = (data) => {
	return new Promise((resolve, reject) => {
		const restaurantObj = {
			restaurantId: data.restaurantId,
			ownerId: data.ownerId,
			name: data.name,
			description: data.description,
			location: data.location,
			phoneNumber: data.phoneNumber,
			emailAddress: data.emailAddress,
			date: data.date,
			active: data.active
		}
		const query = 'INSERT INTO restaurants SET ?';
		db.query(query, restaurantObj, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

/* Upon user registration, create the user's restaurant with a default menu */
module.exports.createRestaurantWithDefaultMenu = (restaurant, menu) => {
	return new Promise((resolve, reject) => {
		const restaurantObj = {
			restaurantId: restaurant.restaurantId,
			ownerId: restaurant.ownerId,
			name: restaurant.Name
		};

		const menuOBj = {
			menuId: menu.menudId,
			restaurantId: menu.restaurantId,
			name: menu.name
		};

		/* Every menu has these 5 default categories */
		const categories = [
			[shortId.generate(), 'Starters', menu.menuId],
			[shortId.generate(), 'Mains', menu.menuId],
			[shortId.generate(), 'Sides', menu.menuId],
			[shortId.generate(), 'Desserts', menu.menuId],
			[shortId.generate(), 'Drinks', menu.menuId]
		];

		const createRestaurant = 'INSERT INTO restaurants SET ?';
		const createMenu = 'INSERT INTO menus SET ?';
		const createCategory = 'INSERT INTO categories (categoryId, name, menuId) VALUES ?';
		
		db.query(createRestaurant, restaurant, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			
			db.query(createMenu, menu, (err, result) => {
				if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
				
				db.query(createCategory, [categories], (err, result) => {
					if(err) return resolve({ err: err });
					if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
					return resolve(result);
				});
			});
		});
	});
}

module.exports.updateRestaurant = (restaurantId, data) => {
	return new Promise((resolve, reject) => {
		const ep = RestaurantService.editableParams;
		const categoryObj = ParamHelper.buildObjBasedOnParams(data, ep);
		const query = 'UPDATE restaurants SET ? ' +
					  'WHERE restaurantId = ?';
		db.query(query, [categoryObj, restaurantId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.updateRestaurantDetails = (restaurantId, details) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetails (`restaurantId`, `key`, `value`) VALUES ? ' +
                      'ON DUPLICATE KEY ' +
                      'UPDATE value = VALUES(value), date = NOW()';
		db.query(query, [details], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.deactivateRestaurant = (restaurantId, details) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE restaurants SET active = 0 WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
 		});
 	});
}