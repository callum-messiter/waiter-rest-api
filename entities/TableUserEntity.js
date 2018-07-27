const db = require('../config/database');
const e = require('../helpers/ErrorHelper').errors;

module.exports.getTableInfoByCustomer = (customerId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM tableusers WHERE customerId = ?';
		db.query(query, customerId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

/*
	There is a unique constraint on the `customerId` field.
	The customer can only be assigned to a single table at a time.
	If a row already exists containing the current customer's ID, 
	replace the tableNo value with the update table number.
	This should only happen if the customer initially mistakenly 
	enters the incorrect table number
*/
module.exports.addUserToTable = (data) => {
	const tableData = {
		customerId: data.customerId,
		restaurantId: data.restaurantId,
		tableNo: data.tableNo
	};
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO tableusers SET ? ' + 
				  	  'ON DUPLICATE KEY ' + 
				  	  'UPDATE tableNo = ?, restaurantId = ?, time = NOW()';
		db.query(query, [tableData, tableData.tableNo, tableData.restaurantId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.getAllTableUsersForRestaurant = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM tableusers WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.removeUserFromTable = (customerId) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM tableusers WHERE customerId = ?';
		db.query(query, customerId, (err, result) => {
			if(err) return resolve({ err: err });
			return resolve(result);
		});
	});
}