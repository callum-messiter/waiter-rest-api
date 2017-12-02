// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
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
		ResponseHelper.invalidRequest(res, ['menuId']);
	} else {
		const menuId = req.params.menuId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getMenuOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.resourceNotFound(res, 'menu');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// User details can be accessed only by the owner, or by an internal admin
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'menu');
						} else {
							Menus.getMenuDetails(menuId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'getMenuDetails', err);
								} else if(result.length < 1) {
									ResponseHelper.resourceNotFound(res, 'menu');
								} else {
									/**
										The following is horribly inefficient and verbose. The queries with joins to get all items belonging to the menu
										didn't work if there were zero items (if the menu has empty categories, the query returns nothing.). I can't yet figure
										out how to do this with a single query. Think we need a LEFT JOIN.
									**/

									// Build response object skeleton
									const menu = {
										menuId: result[0].menuId,
										menuName: result[0].name,
									};
									// Get the menu's categories
									Menus.getMenuCategories(menuId, (err, result) => {
										if(err) {
											ResponseHelper.customError(res, 500, 'get_menu_categories_query_error', err);
										} else if(result.length < 1) {
											// Return a menu object without categories
											ResponseHelper.customSuccess(res, 200, menu);
										} else {
											// If there are categories, add them to the menu object
											menu.categories = result;
											// Add an empty items array to each category object
											for(i = 0; i < menu.categories.length; i++) {
												menu.categories[i].items = [];
											}
											// Get all menu items
											Menus.getMenuItems(menuId, (err, result) => {
												if(err) {
													ResponseHelper.sql(res, 'getMenuItems', err);
												} else if(result.length < 1) {
													ResponseHelper.customSuccess(res, 200, menu);
												} else {
													// Add the items from the query to their respective categories
													result.forEach(function(item) {
														const categoryId = item.categoryId;
														const categories = menu.categories;
														categories.forEach(function(category) {
															// If the item from the query has the same categoryId as the category...
															if(category.categoryId == categoryId) {
																// ...add the item to this category
																category.items.push({
																	itemId: item.itemId,
																	name: item.name,
																	price: item.price,
																	description: item.description
																});
															}
														});
													});
													ResponseHelper.customSuccess(res, 200, menu);
												}
											});
										}
									})
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
router.post('/create', (req, res, next) => {
		// Check auth header and menuId param
	if(!req.headers.authorization) {
		ResponseHelper.invalidRequest(res);
	} else {
		// Check required item data
		if(!req.body.name || !req.body.restaurantId) {
			ResponseHelper.missingRequiredData(res, ['name', 'restaurantId']);
		} else {
			const token = req.headers.authorization;
			const restaurantId = req.body.restaurantId;
			const menu = req.body;
			menu.menuId = shortId.generate();
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.invalidToken(res);
				} else {
					// Check that the requester owns the restaurant
					Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
						if(err) {
							ResponseHelper.sql(res, 'getRestaurantOwnerId', err);
						} else if(result.length < 1) {
							ResponseHelper.resourceNotFound(res, 'restaurant');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								ResponseHelper.unauthorised(res, 'restaurant');
							} else {
								// Create menu
								Menus.createNewMenu(menu, (err, result) => {
									if(err) {
										ResponseHelper.sql(res, 'createNewMenu', err);
									} else {
										// Return the ID of the new menu
										ResponseHelper.customSuccess(res, 200, {
											createdMenu: {
												menuId: menu.menuId,
												menuName: menu.name
											}
										});
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
		ResponseHelper.invalidRequest(res, ['menuId']);
	} else {
		const token = req.headers.authorization;
		const menuId = req.params.menuId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				// Check that the requester owns the menu
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getMenuOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.resourceNotFound(res, 'menu');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'menu');
						} else {
							// Deactivate menu
							Menus.deactivateMenu(menuId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'deactivateMenu', err);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.customSuccess(res, 200);
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
		ResponseHelper.invalidRequest(res, ['menuId']);
	} else {
		const token = req.headers.authorization;
		const menuId = req.params.menuId;
		const menuData = req.body;
		// Check that the body params are allowed; write an external helper function for this
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				// Check that the requester owns the menu
				Menus.getMenuOwnerId(menuId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getMenuOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.resourceNotFound(res, 'menu');
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'menu');
						} else {
							// Update Menu
							Menus.updateMenuDetails(menuId, menuData, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'updateMenuDetails', err);
								} else if(result.changedRows < 1) {
									QueryHelper.diagnoseQueryError(result, res);
								} else {
									ResponseHelper.customSuccess(res, 200);					
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