// Dependencies
const express = require('express');
const router = express.Router();
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
// Models
const Menus = require('../models/Menus');

/**
	Get an entire menu by ID; includes all categories and items
**/
router.get('/:menuId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a userId and a token. At least one of these parameters was missing from the request.');
	} else {
		const menuId = req.params.menuId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				const requesterRole = decodedpayload.userRole;
				const requesterId = decodedpayload.userId;
				const waiterAdmin = UserRoles.roleIDs.waiterAdmin;
				// User details can be accessed only by the owner, or by an internal admin
				if(requesterId != userId && requesterRole != waiterAdmin) {
					ResponseHelper.sendError(res, 401, 'unauthorised', 
						'A user\'s details can be accessed only by the owner, or by admins.');
				} else {
					Menus.getMenuById(menuId, (err, menu) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'get_menu_query_error', err);
						} else if(menu.length < 1) {
							ResponseHelper.sendError(res, 404, 'menu_not_found', 
									'There are no menus matching the ID provided.');
						} else {
							res.json(menu);
						}
					});
				}
			}
		});
	}
});

module.exports = router;