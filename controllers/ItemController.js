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
		ResponseHelper.invalidRequest(res);
	} else {
		// Check required item data
		if(!req.body.name || !req.body.price || !req.body.categoryId) {
			ResponseHelper.missingRequiredData(res, ['name', 'price', 'categoryId']);
		} else {
			const token = req.headers.authorization;
			const item = req.body;

			// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
			const requestDataIsValid = RequestHelper.checkRequestDataIsValid(item, allowedItemParams, res);
			if(requestDataIsValid !== true) {
				ResponseHelper.sendError(res, 422, 'invalid_data_params', 
					"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.",
					ResponseHelper.msg.default
				);
			} else {
				item.itemId = shortId.generate();
				// Check that the token is valid
				Auth.verifyToken(token, (err, decodedpayload) => {
					if(err) {
						ResponseHelper.invalidToken(res);
					} else {
						// Check that the requester owns the menu
						Categories.getCategoryOwnerId(item.categoryId, (err, result) => {
							if(err) {
								ResponseHelper.sql(res, 'getCategoryOwnerId', err);
							} else if(result.length < 1) {
								ResponseHelper.sendError(res, 404, 'owner_id_not_found', 
									'The query returned zero results. It is likely that a category with the specified ID does not exist.',
									ResponseHelper.msg.default
								);
							} else {
								const ownerId = result[0].ownerId;
								const requesterId = decodedpayload.userId;
								// Menus can only be modified by the menu owner
								if(requesterId != ownerId) {
									ResponseHelper.unauthorised(res, 'menu');
								} else {
									// Create item
									Items.createNewItem(item, (err, result) => {
										if(err) {
											ResponseHelper.sql(res, 'createNewItem', err);
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
		ResponseHelper.invalidRequest(res, ['itemId']);
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		const itemData = req.body;

		// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
		const requestDataIsValid = RequestHelper.checkRequestDataIsValid(itemData, allowedItemParams, res);
		if(requestDataIsValid !== true) {
			ResponseHelper.sendError(res, 422, 'invalid_data_params', 
				"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.",
				ResponseHelper.msg.default
			);
		} else {
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.invalidToken(res);
				} else {
					// Check that the requester owns the menu
					Items.getItemOwnerId(itemId, (err, result) => {
						if(err) {
							ResponseHelper.sql(res, 'getItemOwnerId', err);
						} else if(result.length < 1) {
							ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
								'The query returned zero results. It is likely that an item with the specified ID does not exist.',
								ResponseHelper.msg.default
							);
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								ResponseHelper.unauthorised(res, 'item');
							} else {
								// Update item
								Items.updateItemDetails(itemId, itemData, (err, result) => {
									if(err) {
										ResponseHelper.sql(res, 'updateItemDetails', err);
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
		ResponseHelper.invalidRequest(res, ['itemId']);
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				// Check that the requester owns the menu
				Items.getItemOwnerId(itemId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getItemOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that an item with the specified ID does not exist.',
							ResponseHelper.msg.default
						);
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'item');
						} else {
							// Deactivate item
							Items.deactivateItem(itemId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'deactivateItem', err);
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
		ResponseHelper.invalidRequest(res, ['categoryId']);
	} else {
		const token = req.headers.authorization;
		const categoryId = req.params.categoryId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				Categories.getCategoryOwnerId(categoryId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getCategoryOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that a category with the specified ID does not exist.',
							ResponseHelper.msg.default
						);
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'category');
						} else {
							Items.getAllItemsFromCategory(categoryId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'getAllItemsFromCategory', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'no_items_found', 
										'No items belonging to the specified category were found.',
										ResponseHelper.msg.default
									);
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
		ResponseHelper.invalidRequest(res, ['itemId']);
	} else {
		const token = req.headers.authorization;
		const itemId = req.params.itemId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				Items.getItemOwnerId(itemId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getItemOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that an item with the specified ID does not exist.',
							ResponseHelper.msg.default
						);
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'item');
						} else {
							Items.getItemById(itemId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'getItemById', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'no_item_found', 
										'The query returned zero results. This is a contradiction, since the ownerId of the item was found successfully. Contact the dev.',
										ResponseHelper.msg.default
									);
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