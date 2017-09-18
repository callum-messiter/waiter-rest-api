// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Menus = require('../models/Menus');
const Auth = require('../models/Auth');
const UserRoles = require('../models/UserRoles');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');

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
						JsonResponse.sendError(res, 500, 'get_menu_owner_query_error', err);
					} else if(result.length < 1) {
						JsonResponse.sendError(res, 404, 'owner_id_not_found',
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

module.exports = router;