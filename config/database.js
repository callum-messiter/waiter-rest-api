const mysql = require('mysql');

const dbCredentials = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'waiter'
} 

const connection = mysql.createConnection(dbCredentials);

connection.connect(function(err) {
	if (err) throw err;
	console.log('Connected to database: ' + dbCredentials.database + '!');
});

module.exports = connection;