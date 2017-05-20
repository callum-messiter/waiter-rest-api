const express = require('express');
const router = express.Router();

// Import any api-specific controllers here
const SurveyController = require('../controllers/UserController');

// Append controller routes to the '/api' endpoint here
router.use('/surveys', UserController); // Requests to '/api/users' => UserController, and its respective routes

module.exports = router;
