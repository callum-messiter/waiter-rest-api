// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Restaurants = require('../models/Restaurants');
const Menus = require('../models/Menus');
const Auth = require('../models/Auth');
const Users = require('../models/Users');

// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');

/**
	Get all active restaurants
**/
router.get('/', (req, res, next) => {

	Restaurants.getAllRestaurants((err, restaurants) => {
		if(err) {
			ResponseHelper.sql(res, 'getAllRestaurants', err); 
		} else if(restaurants.length < 1) {
			ResponseHelper.resourceNotFound(res, 'restaurants');
		} else {
			/**
				HORRIBLE HACK:

				I need each object in the restaurants array to contain
				an array of the restaurant's menu.

				This surely can be done using one SQL query, but I don't know how.
			**/

			for(var i = 0; i < restaurants.length; i++) {
				restaurants[i].menus = [];
			}

			Menus.getAllMenus((err, menus) => {
				if(err) {
					ResponseHelper.sql(res, 'getAllMenus', err); 
				} else {
					restaurants.forEach((r) => {
						menus.forEach((m) => {
							if(r.restaurantId == m.restaurantId) {
								r.menus.push({
									menuId: m.menuId,
									name: m.name
								});
							}
						});
					});
					ResponseHelper.customSuccess(res, 200, restaurants);
				}
			});
		}
	});
});

/**
	Get a restaurant and its details
**/
router.get('/:restaurantId', (req, res, next) => {
		// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.invalidRequest(res, ['restaurantId']);
	} else {
		const restaurantId = req.params.restaurantId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getRestaurantOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.resourceNotFound(res, 'restaurant');
					} else {
						const requesterId = decodedpayload.userId;
						const ownerId = result[0].ownerId;
						// User details can be accessed only by the owner, or by an internal admin. Future: restaurant details accessible to users granted access by restaurant owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'restaurant');
						} else {
							// Get the restaurant details
							Restaurants.getRestaurantById(restaurantId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'getRestaurantById', err);
								} else if(result.length < 1) {
									ResponseHelper.resourceNotFound(res, 'restaurant');
								} else {
									// There may be multiple restaurants owned by a single user; for now, get the first restuarant returned
									ResponseHelper.customSuccess(res, 200, {
										name: result[0].name,
										description: result[0].description,
										location: result[0].location,
										phoneNumber: result[0].phoneNumber,
										emailAddress: result[0].emailAddress
									});
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
	Create a new restaurant, assigned to the requester user
**/
router.post('/create/:userId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.userId) {
		ResponseHelper.invalidRequest(res, ['userId']);
	} else {
		// Check required item data
		if(!req.body.name || !req.body.description || !req.body.location || !req.body.phoneNumber || !req.body.emailAddress) {
			ResponseHelper.missingRequiredData(res, ['name', 'description', 'location', 'phoneNumber', 'emailAddress']);
		} else {
			const token = req.headers.authorization;
			const userId = req.params.userId;
			const restaurant = req.body;
			// Add the restaurantId and ownerId
			restaurant.restaurantId= shortId.generate();
			restaurant.ownerId = userId;

			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.invalidToken(res);
				} else {
					// Check that the user with the specified ID exists (we need to check that the user is who they say they are, using session)
					Users.getUserById(userId, (err, result) => {
						if(err) {
							ResponseHelper.sql(res, 'getUserById', err);
						} else if(result.length < 1) {
							ResponseHelper.resourceNotFound(res, 'user');
						} else {
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != userId) {
								ResponseHelper.unauthorised(res, 'user account');
							} else {
								// Create restaurant
								Restaurants.createNewRestaurant(restaurant, (err, result) => {
									if(err) {
										ResponseHelper.sql(res, 'createNewRestaurant', err);
									} else {
										// Return the ID of the new restaurant
										ResponseHelper.customSuccess(res, 200, {createdRestaurantId: restaurant.restaurantId});
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
	Update the details of a category
**/
router.put('/update/:restaurantId', (req, res, next) => {
	// Check auth header and restaurantId param
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.invalidRequest(res, ['restaurantId']);
	} else {
		// Function for validating data: params must be valid, and required parmas must be provided
		const token = req.headers.authorization;
		const restaurantId = req.params.restaurantId;
		const restaurantData = req.body;
		// Check that the body params are allowed; write an external helper function for this
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				// Check that the requester owns the menu
				Restaurants.getRestaurantOwnerId(restaurantId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getRestaurantOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.customError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that a restaurant with the specified ID does not exist.',
							ResponseHelper.msg.default.user
						);
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'restaurant');
						} else {
							// Update Menu
							Restaurants.updateRestaurantDetails(restaurantId, restaurantData, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'updateRestaurantDetails', err);
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
	Deactivate a restaurant, such that it will no longer be visible to the user, but recoverable in the future
**/
router.put('/deactivate/:restaurantId', (req, res, next) => {
		// Check auth header and restaurantId param
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.invalidRequest(res, ['restaurantId']);
	} else {
		const token = req.headers.authorization;
		const restaurantId = req.params.restaurantId;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.invalidToken(res);
			} else {
				// Check that the requester owns the menu
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
							// Deactivate menu
							Restaurants.deactivateRestaurant(restaurantId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'deactivateRestaurant', err);
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