// Dependencies
const express = require('express');
const router = express.Router();
// Models
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
// Helpers
const JsonResponse = require('../helpers/JsonResponse');
const Request = require('../helpers/Request');
// Schema
const allowedCategoryParams = Categories.schema.requestBodyParams;

/**
	Add a new category to a menu
**/
router.post('/create/:menuId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.menuId) {
		JsonResponse.sendError(res, 404, 'missing_required_params', 
			"The server was expecting an 'authorization' header and a menuId. At least one of these params was missing.");
	} else {
		// Check required item data
		if(!req.body.name) {
			JsonResponse.sendError(res, 404, 'missing_required_params', 
			'The server was expecting a category name.');
		} else {
			const token = req.headers.authorization;
			const menuId = req.params.menuId;
			const category = req.body;

			// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
			const requestDataIsValid = Request.checkRequestDataIsValid(category, allowedCategoryParams, res);
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
									// Create category
									Categories.createNewCategory(menuId, category, (err, result) => {
										if(err) {
											JsonResponse.sendError(res, 500, 'create_category_query_error', err);
										} else {
											// Return the ID of the new category
											JsonResponse.sendSuccess(res, 200, {createdCategoryId: result.insertId});
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

module.exports = router;