// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Restaurants = require('../models/Restaurants');
const Auth = require('../models/Auth');

// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');

router.get('/restaurant/:restaurantId', (req, res, next) => {
		// Check that the request contains a token, and the Id of the user whose details are to be retrieved
	if(!req.headers.authorization || !req.params.restaurantId) {
		ResponseHelper.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a restaurantId and a token. At least one of these parameters was missing from the request.');
	} else {
		const restaurantId = req.params.restaurantId;
		const token = req.headers.authorization;
		// Check that the token is valid
		Auth.verifyToken(token, (err, decodedpayload) => {
			if(err) {
				ResponseHelper.sendError(res, 401, 'invalid_token', 
					'The server determined that the token provided in the request is invalid. It likely expired - try logging in again.');
			} else {
				Users.getRestaurantOwnerId(restaurantId, (err, result) => {
					if(err) {
						ResponseHelper.sendError(res, 500, 'get_restaurant_owner_query_error', err);
					} else if(result.length < 1) {
						ResponseHelper.sendError(res, 404, 'owner_id_not_found',
							'The query returned zero results. It is likely that a restaurant with the specified ID does not exist.')
					} else {
						const requesterId = decodedpayload.userId;
						const ownerId = result.ownerId;
						// User details can be accessed only by the owner, or by an internal admin. Future: restaurant details accessible to users granted access by restaurant owner
						if(requesterId != userId) {
							ResponseHelper.sendError(res, 401, 'unauthorised', 
								'A restaurant\'s details can be accessed only by the owner.');
						} else {
							// Get the restaurant details
							Restaurants.getRestaurant(restaurantId, (err, result) => {
								if(err) {
									ResponseHelper.sendError(res, 500, 'get_restaurant_query_error', err);
								} else if(result.length < 1) {
									ResponseHelper.sendError(res, 404, 'restaurant_not_found', 
										'The user appears to have zero registered restaurants.');
								} else {
									// There may be multiple restaurants owned by a single user; for now, get the first restuarant returned
									const restaurant = {
										name: result[0].Name,
										description: result[0].Description,
										location: result[0].Location,
										phoneNumber: result[0].PhoneNumber,
										emailAddress: result[0].EmailAddress
									}
									ResponseHelper.sendSuccess(res, 200, {restaurant: restaurant});
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