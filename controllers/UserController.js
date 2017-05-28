const express = require('express');
const router = express.Router();
const Users = require('../models/Users');

router.get('/create', (req, res, next) => {
	Users.create(req.query, (err) => {
		if(err) {
			res.send(response = {
				success: 'false',
				msg: err
			});
		} else {
			res.send(response = {
				success: 'true',
				msg: 'The user was sucessfully added to the database!'
			});
		}
	});
});

module.exports = router;
