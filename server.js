const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const socket = require('socket.io');
const db = require('./config/database');
const conf = require('./config/config');
const router = require('./router');
const errorHandler = require('./helpers/error').errorHandler
const liveKitchenHandler = require('./controllers/LiveKitchen').handler;

console.log("      _    ____ ___     ");
console.log("     / \\  |  _ \\_ _|  ");
console.log("    / _ \\ | |_) | |    ");
console.log("   / ___ \\|  __/| |    ");
console.log("  /_/   \\_\\_|  |___|  ");
console.log("┌-----------------------------------");
console.log(`| Env: ${process.env.API_ENV}`);
console.log(`| URL: ${conf.baseUrl}:${conf.port}`);

/* Register middleware */
app.use(cors());
app.use(bodyParser.urlencoded( { extended: true } ));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);
app.use(errorHandler);

/* Start server */
const server = app.listen(conf.port, () => {
	console.log(`| Server is listening on port ${conf.port}`);
	console.log("└-----------------------------------");
});

/* Configure WebSockets */
const io = socket(server);
io.on('connection', liveKitchenHandler);

module.exports = server;