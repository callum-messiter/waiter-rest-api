const db = require('../config/database');
const e = require('../helpers/error').errors;

/*
	As we migrate to async-await, we will use only the async-await version of the method, and remove the non-async-await version 
	once it's no longer it use
*/
module.exports.async = {
	removeUserFromTable: (customerId) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'DELETE FROM tableusers WHERE customerId = ?';
			db.query(query, customerId, (err, result) => {
				if(err) {
					response.error = err;
				} else {
					response.data = result;
				}
				return resolve(response);
			});
		});
	},
	addUserToTable: (data) => {
		const tableData = {
			customerId: data.customerId,
			restaurantId: data.restaurantId,
			tableNo: data.tableNo
		};
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'INSERT INTO tableusers SET ? ' + 
					  	  'ON DUPLICATE KEY ' + 
					  	  'UPDATE tableNo = ?, restaurantId = ?, time = NOW()';
			db.query(query, [tableData, tableData.tableNo, tableData.restaurantId], (err, result) => {
				if(err) {
					response.error = err;
					return resolve(response);
				}
				if(result.affectedRows < 1) {
					response.error = e.sqlInsertFailed;
					return resolve(response);
				}
				response.data = result;
				return resolve(response);
			});
		});
	},
	getTableInfoByCustomer: (customerId) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const query = 'SELECT * FROM tableusers WHERE customerId = ?';
			db.query(query, customerId, (err, tableInfo) => {
				if(err) {
					response.error = err;
				} else {
					response.data = tableInfo;
				}
				return resolve(response);
			});
		});
	}
}

/*
	There is a unique constraint on the `customerId` field.
	The customer can only be assigned to a single table at a time.
	If a row already exists containing the current customer's ID, 
	replace the tableNo value with the update table number.
	This should only happen if the customer initially mistakenly 
	enters the incorrect table number
*/
module.exports.addUserToTable = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO tableusers SET ? ' + 
					  'ON DUPLICATE KEY ' + 
					  'UPDATE tableNo = ?, restaurantId = ?, time = NOW()';
		db.query(query, [data, data.tableNo, data.restaurantId], (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

module.exports.removeUserFromTable = function(customerId) {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM tableusers WHERE customerId = ?';
		db.query(query, customerId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	})
}

module.exports.getTableInfoByCustomer = function(customerId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM tableusers WHERE customerId = ?';
		db.query(query, customerId, (err, tableInfo) => {
			if(err) return reject(err);
			resolve(tableInfo);
		});
	});
}

module.exports.getAllTableUsersForRestaurant = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM tableusers WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, tableUsers) => {
			if(err) return reject(err);
			resolve(tableUsers);
		});
	});
}