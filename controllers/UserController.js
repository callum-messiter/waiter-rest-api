const express = require('express');
const router = express.Router();
const Survey = require('../models/users');

// Redirect requests for '/api/users/' to '/api/users/all'
router.get('/', (req, res, next) => {
	res.redirect('/api/surveys/all');
});

module.exports = router;
