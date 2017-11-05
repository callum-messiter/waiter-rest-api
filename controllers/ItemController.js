// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Items = require('../models/Items');
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
// Schema
const allowedItemParams = Items.schema.requestBodyParams;

/**
	Create a new item, assigned to a category
**/
router.post('/create', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header.");
	} else {
		// Check required item data
		if(!req.body.name || !req.body.price || !req.body.categoryId) {
			ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting an item name, item price, and categoryId. At least one of these params was missing.');
		} else {
			const token = req.headers.authorization;
			const item = req.body;

			// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
			const requestDataIsValid = RequestHelper.checkRequestDataIsValid(item, allowedItemParams, res);
			if(requestDataIsValid !== true) {
				ResponseHelper.sendError(res, 422, 'invalid_data_params', 
					"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.");
			} else {
				item.itemId = shortId.generate();
				// Check that the token is valid
				Auth.verifyToken(token, (err, decodedpayload) => {
					if(err) {
						ResponseHelper.sendError(res, 401, 'invalid_token', 
							'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
					} else {
						// Check that the requester owns the menu
						Categories.getCategoryOwnerId(item.categoryId, (err, result) => {
							if(err) {
								ResponseHelper.sendError(res, 500, 'get_category_owner_query_error', err);
							} else if(result.length < 1) {
								ResponseHelper.sendError(res, 404, 'owner_id_not_found', 
									'The query returned zero results. It is likely that a category with the specified ID does not exist.');
							} else {
								const ownerId = result[0].ownerId;
								const requesterId = decodedpayload.userId;
								// Menus can only be modified by the menu owner
								if(requesterId != ownerId) {
									ResponseHelper.sendError(res, 401, 'unauthorised', 
										'A menu can be modified only by the menu owner.');
								} else {
									// Create item
									Items.createNewItem(item, (err, result) => {
										if(err) {
											ResponseHelper.sendError(res, 500, 'create_new_item_query_error', err);
										} else {
											// Return the ID of the new item
											ResponseHelper.sendSuccess(res, 200, {createdItemId: item.itemId});
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

/**
	Update the details of an item
**/
router.put('/update/:itemId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.itemId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and an itemId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		const itemData = req.body;

		// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
		const requestDataIsValid = RequestHelper.checkRequestDataIsValid(itemData, allowedItemParams, res);
		if(requestDataIsValid !== true) {
			ResponseHelper.sendError(res, 422, 'invalid_data_params', 
				"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.");
		} else {
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.sendError(res, 401, 'invalid_token', 
						'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
				} else {
					// Check that the requester owns the menu
					Items.getItemOwnerId(itemId, (err, result) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'get_item_owner_query_error', err);
						} else if(result.length < 1) {
							ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
								'The query returned zero results. It is likely that an item with the specified ID does not exist');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								ResponseHelper.sendError(res, 401, 'unauthorised', 
									'An item can be modified only by the item (menu) owner.');
							} else {
								// Update item
								Items.updateItemDetails(itemId, itemData, (err, result) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'update_item_query_error', err);
									} else if(result.changedRows < 1) {
										QueryHelper.diagnoseQueryError(result, res);
									} else {
										ResponseHelper.sendSuccess(res, 200);
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

/**
	Deactivate item, such that it will no longer be visible to the user, but recoverable in the future
**/
router.put('/deactivate/:itemId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.itemId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and an itemId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Check that the requester owns the menu
				Items.getItemOwnerId(itemId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_item_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that an item with the specified ID does not exist');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'An item can be modified only by the item (menu) owner.');
						} else {
							// Deactivate item
							Items.deactivateItem(itemId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'deactivate_item_query_error', err);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.sendSuccess(res, 200);
								}
							});
						}
					}
				});
			}
		});
	}
});

/**
	Get all items associated with a particular category
**/
router.get('/fromCategory/:categoryId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.categoryId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a categoryId and a token. At least one of these parameters was missing from the request.');
	} else {
		const token = req.headers.authorization;
		const categoryId = req.params.categoryId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				Categories.getCategoryOwnerId(categoryId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_category_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that a category with the specified ID does not exist.')
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A user\'s details can be accessed only by the owner.');
						} else {
							Items.getAllItemsFromCategory(categoryId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'get_category_items_query_error', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'no_items_found', 
										'No items belonging to the specified category were found.');
								} else {
									ResponseHelper.sendSuccess(res, 200, result);
								}
							});
						}
					}
				});
			}
		});
	}
});

/**
	Get a single item by referencing its ID
**/
router.get('/:itemId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.itemId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting an itemId and a token. At least one of these parameters was missing from the request.');
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				Items.getItemOwnerId(itemId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_item_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that an item with the specified ID does not exist.')
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A resource can be accessed only by the owner.');
						} else {
							Items.getItemById(itemId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'get_item_query_error', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'no_item_found', 
										'The query returned zero results. This is a contradiction, since the ownerId of the item was found successfully. Contact the dev.');
								} else {
									ResponseHelper.sendSuccess(res, 200, result);
								}
							});
						}
					}
				});
			}
		});
	}
});

module.exports = router;