const shortId = require('shortid');
const db = require('../config/database');
const e = require('../helpers/error').errors;

/* 
	Allowed restaurant details - key names to be stored in the DB
*/
module.exports.allowedRestaurantDetails = {
	companyName_stripe: 'companyName_stripe',
	country_stripe: 'country_stripe', /* Currently stored in restaurantdetailspayment */
	currency_stripe: 'currency_stripe', /* Currently stored in restaurantdetailspayment */
	accountId_stripe: 'accountId_stripe', /* Currently stored in restaurantdetailspayment */
	
	legalEntityType_stripe: 'legalEntityType_stripe', /* company or individual */
	additionalOwners_stripe: 'additionalOwners_stripe', /* We do not store currently */
	taxIdProvided_stripe: 'taxIdProvided_stripe', /* boolean */
	tosAccepted_stripe: 'tosAccepted_stripe', /* boolean */
	accountVerified_stripe: 'accountVerified_stripe', /* boolean */
	
	addressLine1_stripe: 'addressLine1_stripe', 
	addressCity_stripe: 'addressCity_stripe', 
	addressPostcode_stripe: 'addressPostcode_stripe',
	
	companyRepFName_stripe: 'companyRepFName_stripe',
	companyRepLName_stripe: 'companyRepLName_stripe',
	companyRepDob_stripe: 'companyRepDob_stripe', /* Store as `YYYY-MM-DD` string */
	companyRepAddressLine1_stripe: 'companyRepAddressLine1_stripe', 
	companyRepAddressCity_stripe: 'companyRepAddressCity_stripe',
	companyRepAddressPostcode_stripe: 'companyRepAddressPostcode_stripe',
	
	bankAccountHolderName_stripe: 'bankAccountHolderName_stripe',
	bankAccountHolderType_stripe: 'bankAccountHolderType_stripe',
	bankAccountConnected_stripe: 'bankAccountConnected_stripe', /* boolean */
}

/*
	Entity
*/

/* Retrieves a restaurant with the provided ID from the `restaurants` table */
module.exports.getRestaurantById = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM restaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, restaurants) => {
			if(err) return reject(err);
			resolve(restaurants);
		});
	});
}

/* Get restaurant by owner (user) Id */
module.exports.getRestaurantByOwnerId = function(ownerId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM restaurants WHERE ownerId = ?';
		db.query(query, ownerId, (err, restaurant) => {
			if(err) return reject(err);
			resolve(restaurant);
		});
	});
}

/* Get the ID of the restaurant's owner */
module.exports.getRestaurantOwnerId = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT ownerId FROM restaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

/* Get all restaurants, and later we will filter this result by location (vicitiny to user's location */
module.exports.getAllRestaurants = function() {
	return new Promise((resolve, reject) => {
		const query = 'SELECT restaurantId, name FROM restaurants WHERE active = 1';
		db.query(query, (err, restaurants) => {
			if(err) return reject(err);
			resolve(restaurants);
		});
	});
}

/* Get all the menus of a specific restaurant */
module.exports.getMenusForRestaurant = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT menuId, name, restaurantId ' + 
					  'FROM menus ' + 
					  'WHERE restaurantId = ? AND active = 1';
		db.query(query, restaurantId, (err, menus) => {
			if(err) return reject(err);
			resolve(menus);
		});
	});
}

module.exports.getRestaurantDetails = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT `key`, `value` ' +
					  'FROM restaurantdetails ' +
					  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, details) => {
			if(err) return reject(err);
			resolve(details);
		});
	});
}

module.exports.createNewRestaurant = function(restaurant) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurants SET ?';
		db.query(query, restaurant, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

/* Upon user registration, create the user's restaurant with a default menu */
module.exports.createRestaurantWithDefaultMenu = function(restaurant, menu) {
	return new Promise((resolve, reject) => {
		// Default categories
		const categories = [
			[shortId.generate(), 'Starters', menu.menuId],
			[shortId.generate(), 'Mains', menu.menuId],
			[shortId.generate(), 'Sides', menu.menuId],
			[shortId.generate(), 'Desserts', menu.menuId],
			[shortId.generate(), 'Drinks', menu.menuId]
		];

		// Queries
		const createRestaurant = 'INSERT INTO restaurants SET ?';
		const createMenu = 'INSERT INTO menus SET ?';
		const createCategory = 'INSERT INTO categories (categoryId, name, menuId) VALUES ?';
		
		db.query(createRestaurant, restaurant, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			
			db.query(createMenu, menu, (err, result) => {
				if(err) return reject(err);
				if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
				
				db.query(createCategory, [categories], (err, result) => {
					if(err) return reject(err);
					if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
					
					resolve(result);
				});
			});
		});
	});
}

/* Update a restaurant */
module.exports.updateRestaurant = function(restaurantId, restaurantData) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE restaurants SET ? ' +
					  'WHERE restaurantId = ?';
		db.query(query, [restaurantData, restaurantId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			// Will be zero if the data provided does not differ from the existing data
			// if(result.changedRows < 1) return reject();
			resolve(result);
		});
	});
}

/* Update restaurant details (Stripe account details etc.) */
module.exports.updateRestaurantDetails = function(restaurantId, details) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO restaurantdetails (`restaurantId`, `key`, `value`) VALUES ? ' +
                      'ON DUPLICATE KEY ' +
                      'UPDATE value = VALUES(value), date = NOW()';
		db.query(query, [details], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			resolve(result);
		});
	});
}

/* Deactivate a restaurant */
module.exports.deactivateRestaurant = function(restaurantId, details) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE restaurants SET active = 0 WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlUpdateFailed);
			if(result.changedRows < 1) return reject(e.resourceAlreadyInactive);
 			resolve(result);
 		});
 	});
}