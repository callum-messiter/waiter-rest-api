// Dependencies
const express = require('express');
const router = express.Router();
const shortId = require('shortid');
// Models
const Categories = require('../models/Categories');
const Auth = require('../models/Auth');
const Menus = require('../models/Menus');
// Helpers
const ResponseHelper = require('../helpers/ResponseHelper');
const RequestHelper = require('../helpers/RequestHelper');
const QueryHelper = require('../helpers/QueryHelper');
const e = require('../helpers/error').errors;

router.post('/create', (req, res, next) => {
	const u = res.locals.authUser;

	if(!req.body.name || !req.body.menuId) throw e.missingRequiredParams;
	const category = req.body;
	category.categoryId = shortId.generate();

	Menus.getMenuOwnerId(category.menuId)
	.then((m) => {

		if(m.length < 1) throw e.menuNotFound;
		if(!Auth.userHasAccessRights(u, m[0].ownerId)) throw e.insufficientPermissions;
		return Categories.createNewCategory(category);

	}).then((result) => {
		res.status(200).json( data = {createdCategoryId: category.categoryId} );
	}).catch((err) => {
		return next(err);
	});
});

/**
 * @api {post} /category/update/:categoryId UpdateCategory
 * @apiGroup Category
 * @apiDescription Update the name and/or description of an existing category
 * @apiPermission restaurateur, internalAdmin, externalAdmin
 * @apiHeader {String} Authorization The user access token provided by the API upon successful login
 * @apiParam {String} categoryId The id of the category to be updated
 * @apiSuccessExample {json} Success 200
{
    "success": true,
    "error": "",
    "data": {}
}
 * @apiErrorExample {json} 401 Invalid token
{
    "success": false,
    "error": "invalid_token",
    "msg": "The server determined that the token provided in the request is invalid. It likely expired - try logging in again."
}
 * @apiErrorExample {json} 401 Unauthorised: not resource owner
{
    "success": false,
    "error": "unauthorised",
    "msg": "A category can be modified only by the category (menu) owner."
}
 * @apiErrorExample {json} 404 ownerId not found
{
    "success": false,
    "error": "ownerId_not_found",
    "msg": "The query returned zero results. It is likely that a menu with the specified ID does not exist."
}
 * @apiErrorExample {json} 404 Mandatory request data missing
{
    "success": false,
    "error": "request_data_missing",
    "msg": "The server was expecting an 'authorization' header and a categoryId. At least one of these params was missing."
}
 * @apiErrorExample {json} 422 Invalid request parameter
{
    "success": false,
    "error": "invalid_data_param",
    "msg": "The data parameter 'dodgyParam' is not a valid parameter for the resource in question."
}
 * @apiErrorExample {json} 500 getCategoryOwnerId (SQL) error
{
    "success": false,
    "error": "get_category_owner_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
 * @apiErrorExample {json} 500 updateCategoryDetails (SQL) error
{
    "success": false,
    "error": "update_category_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
**/
router.put('/update/:categoryId', (req, res, next) => {
	// Check auth header and menuId param
	if(!req.headers.authorization || !req.params.categoryId) {
		ResponseHelper.invalidRequest(res, ['categoryId']);
	} else {
		const token = req.headers.authorization;
		const categoryId = req.params.categoryId;
		const categoryData = req.body;

		// Since we pass the req.body directly to the query, we need to ensure the params provided are valid and map to DB field names
		const requestDataIsValid = RequestHelper.checkRequestDataIsValid(categoryData, allowedCategoryParams, res);
		if(requestDataIsValid !== true) {
			ResponseHelper.customError(res, 422, 'invalid_data_params', 
				"The data parameter '" + requestDataIsValid + "' is not a valid parameter for the resource in question.",
				REsponseHelper.msg.default.user
			);
		} else {
			// Check that the token is valid
			Auth.verifyToken(token, (err, decodedpayload) => {
				if(err) {
					ResponseHelper.invalidToken(res);
				} else {
					// Check that the requester owns the menu
					Categories.getCategoryOwnerId(categoryId, (err, result) => {
						if(err) {
							ResponseHelper.sql(res, 'getCategoryOwnerId', err);
						} else if(result.length < 1) {
							ResponseHelper.resourceNotFound(res, 'category');
						} else {
							const ownerId = result[0].ownerId;
							const requesterId = decodedpayload.userId;
							// Menus can only be modified by the menu owner
							if(requesterId != ownerId) {
								ResponseHelper.unauthorised(res, 'category');
							} else {
								// Update category
								Categories.updateCategoryDetails(categoryId, categoryData, (err, result) => {
									if(err) {
										ResponseHelper.sql(res, 'updateCategoryDetails', err);
									} else if(result.changedRows < 1) {
										QueryHelper.diagnoseQueryError(result, res);
									} else {
										ResponseHelper.customSuccess(res, 200)									
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
 * @api {post} /category/deactivate/:categoryId DeactivateCategory
 * @apiGroup Category
 * @apiDescription Deactivate a category such that it becomes invisible. It can be restored later, if necessary
 * @apiPermission restaurateur, internalAdmin, externalAdmin
 * @apiHeader {String} Authorization The user access token provided by the API upon successful login
 * @apiParam {String} categoryId The id of the category to be deactivated
 * @apiSuccessExample {json} Success 200
{
    "success": true,
    "error": "",
    "data": {}
}
 * @apiErrorExample {json} 401 Invalid token
{
    "success": false,
    "error": "invalid_token",
    "msg": "The server determined that the token provided in the request is invalid. It likely expired - try logging in again."
}
 * @apiErrorExample {json} 401 Unauthorised: not resource owner
{
    "success": false,
    "error": "unauthorised",
    "msg": "A category can be deactivated  only by the category (menu) owner."
}
 * @apiErrorExample {json} 404 ownerId not found
{
    "success": false,
    "error": "ownerId_not_found",
    "msg": "The query returned zero results. It is likely that a category with the specified ID does not exist."
}
 * @apiErrorExample {json} 404 Mandatory request data missing
{
    "success": false,
    "error": "request_data_missing",
    "msg": "The server was expecting an 'authorization' header and a categoryId. At least one of these params was missing."
}
 * @apiErrorExample {json} 422 Invalid request parameter
{
    "success": false,
    "error": "invalid_data_param",
    "msg": "The data parameter 'dodgyParam' is not a valid parameter for the resource in question."
}
 * @apiErrorExample {json} 500 getCategoryOwnerId (SQL) error
{
    "success": false,
    "error": "get_category_owner_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
 * @apiErrorExample {json} 500 deactivateCategory (SQL) error
{
    "success": false,
    "error": "update_category_query_error",
    "msg": // sql SNAKE_CASE error key - report to the api dev
}
**/
router.put('/deactivate/:categoryId', (req, res, next) => {
	// Check auth header and menuId param
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
				// Check that the requester owns the menu
				Categories.getCategoryOwnerId(categoryId, (err, result) => {
					if(err) {
						ResponseHelper.sql(res, 'getCategoryOwnerId', err);
					} else if(result.length < 1) {
						ResponseHelper.customError(res, 404, 'ownerId_not_found', 
							'The query returned zero results. It is likely that a category with the specified ID does not exist.',
							ResponseHelper.msg.default.user
						);
					} else {
						const ownerId = result[0].ownerId;
						const requesterId = decodedpayload.userId;
						// Menus can only be modified by the menu owner
						if(requesterId != ownerId) {
							ResponseHelper.unauthorised(res, 'category');
						} else {
							// Deactivate item
							Categories.deactivateCategory(categoryId, (err, result) => {
								if(err) {
									ResponseHelper.sql(res, 'deactivateCategory', err);
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