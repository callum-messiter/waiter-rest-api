// Dependencies
const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
// Models
const Orders = require('../models/Orders');
// Config
const secret = require('../config/jwt').secret;
const ResponseHelper = require('../helpers/ResponseHelper');

router.get('/test', (req, res, next) => {
	const restaurantId = 'SkxjHgNYRb';
	Orders.getAllLiveOrdersForRestaurant(restaurantId, (err, result) => {
		if(err) {
			res.json(err);
		} else {
			res.json(result);
		}
	});
});

module.exports = router;