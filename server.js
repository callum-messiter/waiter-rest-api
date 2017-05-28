const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const dbConfig = require('./config/database');

const app = express();
const api = require('./routes/api');
const port = 3000;

// The dbConfig object contains the credentials for connecting to the DB
var con = mysql.createConnection(dbConfig);

con.connect(function(err) {
	if (err) throw err;
	console.log('Connected to database: ' + dbConfig.database + '!');
});

// All requests to /api/* will be mapped to the routes/api file, which contains api-specific routes
app.use('/api', api);

// Parses the body of an incoming request as JSON, and exposes it on req.body - easy to interface with
app.use(bodyParser.json());

// Set the 'public' directory as the home of the application's static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
	console.log('Server listening on port '+port);
});

app.get('/', (req, res, next) => {
	res.render('index');
});
