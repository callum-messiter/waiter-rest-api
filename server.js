// Depdendencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const socket = require('socket.io');
// Config
const dbConfig = require('./config/database');
const router = require('./routes/api');
const error = require('./helpers/error');
const port = 3000;

/**
	START: SERVER CONFIGURATION SETTINGS
**/

// Enable cors
app.use(cors());

// Parses the body of an incoming request as JSON, and exposes it on req.body - easy to interface with
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs');

// Set the 'public' directory as the home of the application's static files
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
	console.log('Server listening on port ' + port);
});

// Websockets setup
const io = socket(server);
io.on('connection', require('./controllers/LiveKitchen').handler);

// All requests to /api/* will be mapped to the routes/api file, which contains api-specific routes
app.use('/api', router);

// Error handling
app.use((err, req, res, next) => {
	// Log the error
	console.log(err);
	// Check that we are handling the error
	if(error.hasOwnProperty(err.errorKey)) {
		res.status(error[err.errorKey].statusCode)
		return res.json(err);
	}
	// If the error is not handled, return a general 500
	res.status(error.internalServerError.statusCode);
	res.json(error.internalServerError);
});


// Redirect requests to /api and / to the documentation page
app.get('/api', (req, res, next) => {
	res.redirect('/apidoc');
});

app.get('/', (req, res, next) => {
	res.redirect('/apidoc');
});

// The following routes are used to demo and test the liveKitchen system
app.get('/mcdonalds', (req, res, next) => {
	res.render('mcdonalds');
});

app.get('/burgerking', (req, res, next) => {
	res.render('burgerking');
});

app.get('/customer1', (req, res, next) => {
	res.render('customer1');
});

app.get('/customer2', (req, res, next) => {
	res.render('customer2');
});