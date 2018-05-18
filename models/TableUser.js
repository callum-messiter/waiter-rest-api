const db = require('../config/database');

/*
	There is a unique constraint on the `customerId` field.
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
			resolve(result);
		});
	});
}