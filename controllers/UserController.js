const express = require('express');
const router = express.Router();
const Users = require('../models/Users');

router.get('/create', (req, res, next) => {
	// Check if the email is already registered. Better: if(!Users.isEmailRegistered) {...}
	Users.isEmailRegistered(req.query.email, (err, result) => {
		if(result[0].matches > 0) {
			res.json(response = {
				success: 'false',
				error: 'The email address provided is already registered.'
			});
		} else {
			// Add the new user to the db
			Users.create(req.query, (err) => {
				if(err) {
					res.json(response = {
						success: 'false',
						msg: err
					});
				} else {
					res.json(response = {
						success: 'true',
						msg: 'The user was sucessfully added to the database!'
					});
				}
			});
		}
	});
});

module.exports = router;
