// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Items = require('../models/Items');
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
const JsonResponse = require('../helpers/JsonResponse');
// Schema
const allowedItemParams = Items.schema.requestBodyParams;

/**
	Create a new item, assigned to a category
**/
router.post('/create/:categoryId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.categoryId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header and a categoryId. At least one of these params was missing.");
	} else {
		// Check required item data
		if(!req.body.name || !req.body.price) {
			JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting an item name and item price. At least one of these params was missing.');
		} else {
			const token = req.headers.authorization;
			const categoryId = req.params.categoryId;
			const item = req.body;

			// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
			if(requestDataIsValid !== true) {
				JsonResponse.sendError(res, 422, 'invalid_data_params', 
					"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.");
			} else {
				// Check that the token is valid
				Auth.verifyToken(token, (err, decodedpayload) => {
					if(err) {
						JsonResponse.sendError(res, 401, 'invalid_token', 
							'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
					} else {
						// Check that the requester owns the menu
						Categories.getCategoryOwner(categoryId, (err, result) => {
							if(err) {
								JsonResponse.sendError(res, 500, 'get_category_owner_query_error', err);
							} else if(result.length < 1) {
								JsonResponse.sendError(res, 404, 'ownerId_not_found', 
									'The query returned zero results. It is likely that a category with the specified ID does not exist');
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
	}
});

router.put('/deactivate/:itemId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.itemId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and an itemId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				JsonResponse.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Check that the requester owns the menu
				Items.getItemOwnerId(itemId, (err, result) => {
					if(err) {
						JsonResponse.sendError(res, 500, 'get_item_owner_query_error', err);
					} else if(result.length < 1) {
						JsonResponse.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that an item with the specified ID does not exist');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							JsonResponse.sendError(res, 401, 'unauthorised', 
								'An item can be modified only by the item (menu) owner.');
						} else {
							// Deactivate item
							Items.deactivateItem(itemId, (err, result) => {
								if(err) {
									JsonResponse.sendError(res, 500, 'deactivaate_item_query_error', err);
								} else if(result.changedRows < 1) {
									diagnoseQueryError(result, res);
								} else {
									JsonResponse.sendSuccess(res, 200);
								}
							});
						}
					}
				});
			}
		});
	}
});

router.put('/update/:itemId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.itemId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and an itemId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		const itemData = req.body;

		// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
		const requestDataIsValid = checkRequestDataIsValid(itemData, allowedItemParams, res);
		if(requestDataIsValid !== true) {
			JsonResponse.sendError(res, 422, 'invalid_data_params', 
				"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.");
		} else {
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					JsonResponse.sendError(res, 401, 'invalid_token', 
						'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
				} else {
					// Check that the requester owns the menu
					Items.getItemOwnerId(itemId, (err, result) => {
						if(err) {
							JsonResponse.sendError(res, 500, 'update_item_owner_query_error', err);
						} else if(result.length < 1) {
							JsonResponse.sendError(res, 404, 'ownerId_not_found', 
								'The query returned zero results. It is likely that an item with the specified ID does not exist');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								JsonResponse.sendError(res, 401, 'unauthorised', 
									'An item can be modified only by the item (menu) owner.');
							} else {
								// Update item
								Items.updateItemDetails(itemId, itemData, (err, result) => {
									if(err) {
										JsonResponse.sendError(res, 500, 'update_item_query_error', err);
									} else if(result.changedRows < 1) {
										diagnoseQueryError(result, res);
									} else {
										JsonResponse.sendSuccess(res, 200);
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

function checkRequestDataIsValid(requestBody, schema, res) {
	for(const k in requestBody) {
		if(!schema.hasOwnProperty(k)) {
			return k;
		}
	}
	return true;
}

function diagnoseQueryError(result, res) {
	// Was the item found in the DB?
	const msg = result.message;
	const itemFound = 'Rows matched: 1';
	if(msg.includes(itemFound)) {
		const itemUpdated = 'Changed: 1';
		// Was the item found, but not updated?
		if(!msg.includes(itemUpdated)) {
			JsonResponse.sendError(res, 409, 'data_already_exists', 
				'The item was found but not changed. This is likely because the new item details provided already exist in the database.');
		// This is a MySQL contradiction that should never arise
		} else {
			JsonResponse.sendError(res, 500, 'error_contradiction', 
				'The server determined that zero rows were changed, and one row was changed. Contact the dev.');
		}
	} else {
		JsonResponse.sendError(res, 404, 'item_not_found', 
			'An item with the specified ID was not found.');
	}
}

module.exports = router;