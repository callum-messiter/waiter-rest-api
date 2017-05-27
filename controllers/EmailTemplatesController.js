const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.send('Email Template');
});

module.exports = router;