const express = require('express');
const router = express.Router();
const AuthRouter = require('./AuthRouter');
const CategoryRouter = require('./CategoryRouter');

router.use(CategoryRouter);
router.use(AuthRouter);

module.exports = router;