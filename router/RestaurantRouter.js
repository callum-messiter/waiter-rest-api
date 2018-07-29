/**
 * @apiDefine Restaurant Restaurant
 * All endpoints relating to the Restaurant resource
 */

const router = require('express').Router();
const AuthMiddleware = require('../middleware/Authentication');
const RestaurantController = require('../controllers/RestaurantController');

/**
 * @api {get} /restaurant List
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName List
 * @apiDescription A user can retrieve a complete list of Waitr's active restaurants.
 * @apiSuccessExample {json} Success-Response (200):
 *{
 *   [
 *     {
 *       "restaurantId": String,
 *       "name": String,
 *       "menus": [
 *       	{
 *	            "id": String,
 *	            "name": String,
 *	            "restaurant": {
 *	                "id": String,
 *	                "name": String
 *	            },
 *	            "categories": [
 *	                {
 *	                    "id": String,
 *	                    "name": String,
 *	                    "items": [
 *							{
 *							    "id": String,
 *						        "name": String,
 *						        "price": Float,
 *						        "description": String
 *							},
 *							...
 *	                    ]
 *	                },
 *					...
 *          	]
 *           },
 *           ...
 *       ]
 *     },
 *     ...
 *   ]
 *}
 */
router.get('/restaurant/list', AuthMiddleware, (req, res, next) => {
	RestaurantController.getList(req, res, next);
});

/**
 * @api {get} /restaurant/:restaurantId Get
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiDescription A user can retrieve a particular restaurant.
 * @apiSuccessExample {json} Success-Response (200):
 * {  
 *    "general": {  
 *        "id": String,
 *        "name": String,
 *        "description": String,
 *        "location": String,
 *        "phoneNumber": String,
 *        "emailAddress": String,
 *        "registrationDate": Int,
 *        "active": Bool,
 *        "owner": {  
 *            "id": String,
 *            "firstName": String,
 *            "lastName": String,
 *            "email": String,
 *            "roleId": Int,
 *            "active": Bool,
 *            "verified": Bool,
 *            "registrationDate": Int
 *        }
 *    },
 *    "stripeAccount": {  
 *        "id": String,
 *        "object": String,
 *        "business_name": String,
 *        "business_url": String,
 *        "charges_enabled": Bool,
 *        "country": String,
 *        "created": Int,
 *        "debit_negative_balances": Bool,
 *        "decline_charge_on": {  
 *            "avs_failure": Bool,
 *            "cvc_failure": Bool
 *        },
 *        "default_currency": String,
 *        "details_submitted": Bool,
 *        "display_name": String,
 *        "email": String,
 *        "external_accounts": {  
 *            "object": String,
 *            "data": Array,
 *            "has_more": Bool,
 *            "total_count": Int,
 *            "url": String
 *        },
 *        "legal_entity": {  
 *            "additional_owners": Array,
 *            "address": {  
 *                "city": String,
 *                "country": String,
 *                "line1": String,
 *                "line2": String,
 *                "postal_code": String,
 *                "state": String
 *            },
 *            "business_name": String,
 *            "business_tax_id_provided": Bool,
 *            "dob": {  
 *                "day": Int,
 *                "month": Int,
 *                "year": Int
 *            },
 *            "first_name": String,
 *            "last_name": String,
 *            "personal_address": {  
 *                "city": String,
 *                "country": String,
 *                "line1": String,
 *                "line2": String,
 *                "postal_code": String,
 *                "state": String
 *            },
 *            "type": String,
 *            "verification": {  
 *                "details": String,
 *                "details_code": String,
 *                "document": String,
 *                "document_back": String,
 *                "status": String
 *            }
 *        },
 *        "metadata": {},
 *        "payout_schedule": {  
 *            "delay_days": Int,
 *            "interval": String
 *        },
 *        "payout_statement_descriptor": String,
 *        "payouts_enabled": Bool,
 *        "product_description": String,
 *        "statement_descriptor": String,
 *        "support_email": String,
 *        "support_phone": String,
 *        "timezone": String,
 *        "tos_acceptance": {  
 *            "date": Int,
 *            "ip": String,
 *            "user_agent": String
 *        },
 *        "type": "custom",
 *        "verification": {  
 *            "disabled_reason": String,
 *            "due_by": String,
 *            "fields_needed": Array
 *        }
 *    },
 *    "menus": [  
 *        {  
 *            "id": String,
 *            "name": String,
 *            "restaurant": {  
 *                "id": String,
 *                "name": String
 *            },
 *            "categories": [  
 *                {  
 *                    "id": String,
 *                    "name": String,
 *                    "items": [  
 *                        {  
 *                            "id": String,
 *                            "name": String,
 *                            "price": Float,
 *                            "description": String
 *                        }
 *                    ]
 *                }
 *            ]
 *        }
 *    ],
 *    "orders": [  
 *        {  
 *            "id": String,
 *            "price": Float,
 *            "status": Int,
 *            "timePlaced": Int,
 *            "customer": {  
 *                "id": String,
 *                "firstName": String,
 *                "lastName": String
 *            },
 *            "restaurant": {  
 *                "id": String,
 *                "name": String,
 *                "tableNo": String
 *            },
 *            "items": [  
 *                {  
 *                    "id": String,
 *                    "name": String,
 *                    "price": Float
 *                }
 *            ]
 *        }
 *    ],
 *    "tableUsers": [  
 *        {  
 *            "id": String,
 *            "restaurantId": String,
 *            "customerId": String,
 *            "tableNo": String,
 *            "time": Int
 *        }
 *    ]
 * }
 * @apiErrorExample restaurantNotFound (404):
 *{
 *   "statusCode": 404,
 *   "errorKey": "restaurantNotFound",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.get('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.get(req, res, next);
});


/**
 * @api {get} /restaurant/:restaurantId/tableUsers Get
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName List
 * @apiDescription A restaurant can retrieve an up-to-date breakdown of which of their tables are occupied by active customers.
 * @apiSuccessExample {json} Success-Response (200):
 *  {
 *    "tableUsers": [
 *         {
 *			   "id": tu.id,
 *			   "restaurantId": String,
 *			   "customerId": String,
 *			   "tableNo": String,
 *			   "time": Int
 *		   },
 *		   ...
 *     ]
 *  }
 * @apiErrorExample restaurantNotFound (404):
 *{
 *   "statusCode": 404,
 *   "errorKey": "restaurantNotFound",
 *   "type": "_auth",
 *   "devMsg": String,
 *   "userMsg": String
 *}
 */
router.get('/restaurant/:restaurantId/tableUsers', AuthMiddleware, (req, res, next) => {
	RestaurantController.getTableUsers(req, res, next);
});

router.post('/restaurant', AuthMiddleware, (req, res, next) => {
	RestaurantController.create(req, res, next)
});

router.patch('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.update(req, res, next)
});

router.patch('/restaurant/:restaurantId/stripeAccount', AuthMiddleware, (req, res, next) => {
	RestaurantController.updateStripeAccount(req, res, next)
});

module.exports = router;