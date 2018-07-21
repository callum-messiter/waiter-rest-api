const mysql = require('mysql');
const config = require('./config');

const dbCredentials = {
	host: config.db.host,
	user:config.db.user,
	password: config.db.pass,
	database: config.db.name
} 

const connection = mysql.createConnection(dbCredentials);

connection.connect((err) => {
	if (err) throw err;
	//console.log('Connected to database: ' + dbCredentials.database + '!');
});

module.exports = connection;