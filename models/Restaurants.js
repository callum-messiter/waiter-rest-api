// Dependencies
// Config
const db = require('../config/database');

/**
	Get restaurant by owner (user) Id
**/

module.exports.getRestaurant = function(userId, callback) {
	const query = 'SELECT * FROM restaurants WHERE OwnerId = ?';
	db.query(query, userId, callback);
}


