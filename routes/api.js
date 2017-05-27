const express = require('express');
const router = express.Router();

// Import any api-specific controllers here
const UserController = require('../controllers/UserController');

// Append controller routes to the '/api' endpoint here
router.use('/users', UserController); // Requests to '/api/users' => UserController, and its respective routes

module.exports = router;
