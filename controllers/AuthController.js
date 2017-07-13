const express = require('express');
const router = express.Router();
const Auth = require('../models/Auth');

router.get('/', (req, res, next) => {
	res.send('Auth');
});

router.get('/login', (req, res, next) => {
	const user = req.query;
	// Make sure that the query keys are correct
	if('username' in user && 'password' in user) {
		
	} else {
		res.json({
			success: 'false',
			msg: 'The required user parameters were not provided.'
		});
	}
	// Run them against database - is there a match (check hashed password with bcrypt)
	// If so, check if user is active and if user is verified
	// User already logged in: Check if the user already has a token - if so, check it against the database
	// If all is fine, generate and return a JWT, add the token to the database
});

router.get('/logout', (req, res, next) => {
	// expire the token - set it to expired in the database
});

module.exports = router;