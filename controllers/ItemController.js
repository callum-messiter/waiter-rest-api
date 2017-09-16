// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Items = require('../models/Items');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
const JsonResponse = require('../helpers/JsonResponse');

/**
	item: {
		itemId: itemId,
		categoryId: categoryId,
		name: name,
		price: price,
		description: description,
		date: date
	}
**/
router.post('/create/:menuId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.menuId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header and a menuId. At least one of these params was missing.");
	} else {
		// Check required item data
		if(!req.body.categoryId || !req.body.name || !req.body.price) {
			JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a categoryId, item name and item price. At least one of these params was missing.');
		} else {
			const token = req.headers.authorization;
			const menuId = req.params.menuId;
			const item = req.body;
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					JsonResponse.sendError(res, 401, 'invalid_token', 
						'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
				} else {
					// Check that the requester owns the menu
					Menus.getMenuOwnerId(menuId, (err, result) => {
						if(err) {
							JsonResponse.sendError(res, 500, 'get_menu_owner_query_error', err);
						} else if(result.length < 1) {
							JsonResponse.sendError(res, 404, 'ownerId_not_found', 
								'The query returned zero results. It is likely that a menu with the specified ID does not exist');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								JsonResponse.sendError(res, 401, 'unauthorised', 
									'A menu can be modified only by the menu owner.');
							} else {
								// Create item
								Items.createNewItem(item, (err, result) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'create_new_item_query_error', err);
									} else {
										// Return the ID of the new item
										JsonResponse.sendSuccess(res, 200, {createdItemId: result.insertId});
									}
								});
							}
						}
					});
				}
			});
		}
	}
});


module.exports = router;