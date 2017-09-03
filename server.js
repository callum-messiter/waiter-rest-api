// Depdendencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
// Config
const dbConfig = require('./config/database');
const api = require('./routes/api');
const port = 3000;

// Enable cors
app.use(cors());

// Parses the body of an incoming request as JSON, and exposes it on req.body - easy to interface with
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// Set the 'public' directory as the home of the application's static files
app.use(express.static(path.join(__dirname, 'public')));

// All requests to /api/* will be mapped to the routes/api file, which contains api-specific routes
app.use('/api', api);

app.listen(port, () => {
	console.log('Server listening on port ' + port);
});

app.get('/', (req, res, next) => {
	res.render('index');
});
