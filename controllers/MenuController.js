// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Menus = require('../models/Menus');
const Auth = require('../models/Auth');
const UserRoles = require('../models/UserRoles');
const Restaurants = require('../models/Restaurants');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const QueryHelper = require('../helpers/QueryHelper');

/**
	Get an entire menu by ID; includes all categories and items
**/
router.get('/:menuId', (req, res, next) => {
	// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.menuId) {
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
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_menu_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that a menu with the specified ID does not exist.')
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A user\'s details can be accessed only by the owner, or by admins.');
						} else {
							Menus.getMenuById(menuId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'get_menu_query_error', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'menu_not_found', 
										'There are no menus matching the ID provided.');
								} else {
									// Build response object skeleton
									const menu = {
										menuId: menuId,
										menuName: result[0].menuName
									}

									// Loop through all items and compile an array of categoryIds
									const categories = [];
									result.forEach(function(item) {
										const newCategory = {
											categoryId: item.categoryId,
											categoryName: item.categoryName,
											items: []
										}
										if(categories.length < 1) {
											categories.push(newCategory);
										} else {
											var unique = true;
											// Is the category with the categoryId already in the categories array?
											categories.forEach(function(category) {
												if(category.categoryId == item.categoryId) {
													unique = false;
												}
											});
											if(unique === true) {
												categories.push(newCategory);
											}
										}
									});

									// Add the items from the query to their respective categories
									result.forEach(function(item) {
										const categoryId = item.categoryId;
										categories.forEach(function(category) {
											// If the item from the query has the same categoryId as the category...
											if(category.categoryId == categoryId) {
												// ...add the item to this category
												const newItem = {
													itemId: item.itemId,
													name: item.name,
													price: item.price,
													description: item.description
												};
												category.items.push(newItem);
											}
										});
									});

									// Add categories array (with all item data) to the menu object and return it
									menu.categories = categories;
									res.json(menu);
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
	Create a new menu, assigned to a restaurant 
**/
router.post('/create/:restaurantId', (req, res, next) => {
		// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header and a restaurantId. At least one of these params was missing.");
	} else {
		// Check required item data
		if(!req.body.name) {
			ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a menu name.');
		} else {
			const token = req.headers.authorization;
			const restaurantId = req.params.restaurantId;
			const menu = req.body;
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.sendError(res, 401, 'invalid_token', 
						'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
				} else {
					// Check that the requester owns the restaurant
					Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
						if(err) {
							ResponseHelper.sendError(res, 500, 'get_restaurant_owner_query_error', err);
						} else if(result.length < 1) {
							ResponseHelper.sendError(res, 404, 'owner_id_not_found', 
								'The query returned zero results. It is likely that a restaurant with the specified ID does not exist.');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								ResponseHelper.sendError(res, 401, 'unauthorised', 
									'A menu can be created only by the restaurant owner.');
							} else {
								// Create menu
								Menus.createNewMenu(restaurantId, menu, (err, result) => {
									if(err) {
										ResponseHelper.sendError(res, 500, 'create_new_menu_query_error', err);
									} else {
										// Return the ID of the new menu
										ResponseHelper.sendSuccess(res, 200, {createdMenuId: result.insertId});
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
	Deactivate a menu, such that it will no longer be visible to the user, but recoverable in the future
**/
router.put('/deactivate/:menuId', (req, res, next) => {
		// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.menuId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and a menuId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const menuId = req.params.menuId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Check that the requester owns the menu
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_menu_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that a menu with the specified ID does not exist');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A menu can only be deactivated by its owner.');
						} else {
							// Deactivate menu
							Menus.deactivateMenu(menuId, (err, result) => {
							if(err) {
								ResponseHelper.sendError(res, 500, 'deactivate_menu_query_error', err);
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
	Update the details of a category
**/
router.put('/update/:menuId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.menuId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header, and a menuId. At least one of these params was missing.");
	} else {
		const token = req.headers.authorization;
		const menuId = req.params.menuId;
		const menuData = req.body;
		// Check that the body params are allowed; write an external helper function for this
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				// Check that the requester owns the menu
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_menu_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that an item with the specified ID does not exist');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A menu can be modified only by its owner.');
						} else {
							// Update Menu
							Menus.updateMenuDetails(menuId, menuData, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'update_menu_query_error', err);
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

module.exports = router;