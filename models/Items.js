const db = require('../config/database');

module.exports.createNewItem = function(item, callback) {
	const query = 'INSERT INTO items SET ?';
	db.query(query, item, callback);
}
