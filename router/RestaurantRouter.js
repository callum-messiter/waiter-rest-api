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
 * @apiUse AuthHeader
 * @apiPermission diner
 * @apiDescription A user can retrieve a complete list of Waitr's active restaurants.
 * @apiSuccessExample {json} Success-Response (200):
 * [  
 *     {  
 *         "restaurantId": String,
 *         "name": String,
 *         "menus": [  
 *             {  
 *                 "id": String,
 *                 "name": String,
 *                 "restaurant": {  
 *                     "id": String,
 *                     "name": String
 *                 },
 *                 "categories": [  
 *                     {  
 *                         "id": String,
 *                         "name": String,
 *                         "items": [  
 *                             {  
 *                                 "id": String,
 *                                 "name": String,
 *                                 "price": Float,
 *                                 "description": String
 *                             }
 *                         ]
 *                     }
 *                 ]
 *             }
 *         ]
 *     }
 * ]
 */
router.get('/restaurant/list', AuthMiddleware, (req, res, next) => {
	RestaurantController.getList(req, res, next);
});

/**
 * @api {get} /restaurant/:restaurantId Get
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiPermission diner
 * @apiDescription A user can retrieve a particular restaurant.
 * @apiParam {String} restaurantId The ID of the restaurant to be retrieved
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
 * {  
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.get('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.get(req, res, next);
});


/**
 * @api {get} /restaurant/:restaurantId/tableUsers Get
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName List
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A restaurant can retrieve an up-to-date breakdown of which of their tables are occupied by active customers.
 * @apiParam {String} restaurantId The ID of the restaurant whose up-to-date table breakdown is to be retrieved
 * @apiSuccessExample {json} Success-Response (200):
 * [  
 *     {  
 *         "id": String,
 *         "restaurantId": String,
 *         "customerId": String,
 *         "tableNo": String,
 *         "time": Int
 *     }
 * ]
 * @apiErrorExample restaurantNotFound (404):
 * {  
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.get('/restaurant/:restaurantId/tableUsers', AuthMiddleware, (req, res, next) => {
	RestaurantController.getTableUsers(req, res, next);
});

/**
 * @api {post} /restaurant Create
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user can create - and assign to himself - a new restaurant.
 * @apiParam {String} ownerId The ID of the user to whom the restaurant is to be assigned
 * @apiParam {String} name The name of the restaurant, e.g. "Fellsville Tandoori"
 * @apiParam {String} [description] A string describing the restaurant, e.g. "Fellsville's favourite Indian restaurant"
 * @apiParam {String} [location] The name of the town in which the restaurant is based
 * @apiParam {String} [email] The restaurant's contact email address
 * @apiParam {String} [phoneNumber] The restaurant's contact number
 * @apiSuccessExample {json} Success-Response (201):
 * {  
 *     "restaurantId": String
 * }
 * @apiErrorExample userNotFound (404):
 * {  
 *     "statusCode": 404,
 *     "errorKey": "userNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.post('/restaurant', AuthMiddleware, (req, res, next) => {
	RestaurantController.create(req, res, next)
});

/**
 * @api {patch} /restaurant/:restaurantId Update
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user can update the details of an existing restaurant.
 * @apiParam {String} [name] The new name of the restaurant, e.g. "Fellsville Best Tandoori"
 * @apiParam {String} [description] A string describing the restaurant, e.g. "Fellsville's favourite Indian cuisine"
 * @apiParam {String} [location] The name of the town in which the restaurant is based
 * @apiParam {String} [email] The restaurant's contact email address
 * @apiParam {String} [phoneNumber] The restaurant's contact number
 * @apiParam {String} [active] This parameter can be used to activate or deactivate a restaurant (only active restaurants are visible to customers).
 * @apiErrorExample restaurantNotFound (404):
 * {  
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.patch('/restaurant/:restaurantId', AuthMiddleware, (req, res, next) => {
	RestaurantController.update(req, res, next)
});

/**
 * @api {patch} /restaurant/:restaurantId/stripeAccount UpdateStripeAccount
 * @apiGroup Restaurant
 * @apiVersion 1.0.0
 * @apiName UpdateStripeAccount
 * @apiUse AuthHeader
 * @apiPermission restaurateur
 * @apiDescription A user can update the stripe-account details of an existing restaurant. This endpoint can also be used to initially _create_ the restaurant's Stripe account.
 * @apiParam {String} restaurantId The ID of the restaurant whose Stripe acccount is to be updated/created
 * @apiParam {String} [type] The type of Stripe account that is to be created. Must be 'custom' 
 * @apiParam {String} [country] The country to which the Stripe account will be associated. Must be the two-letter country code 'GB'
 * @apiParam {String} [email] The email address to be assigned to the Stripe account
 * @apiParam {String} [external_account] A bank account in tokenised form, provided by the Stripe API. It is the responsiblity of the client to first call Stripe's API to retrieve a toke.
 * @apiParam {String} [tos_acceptance] A stringified object detailing the restaurateur's acceptance of Stripe's terms-of-services agreement. Refer to Stripe's docs for info about specific 
 * properties: https://stripe.com/docs/connect/required-verification-information
 * @apiParam {String} [legal_entity] An stringified object detailing such things as the restaurant's owner. Refer to Stripe's docs for info about specific 
 * properties: https://stripe.com/docs/connect/required-verification-information
 * @apiErrorExample restaurantNotFound (404):
 * {  
 *     "statusCode": 404,
 *     "errorKey": "restaurantNotFound",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 * @apiErrorExample malformedRestaurantDetails (400):
 * {  
 *     "statusCode": 400,
 *     "errorKey": "malformedRestaurantDetails",
 *     "type": String,
 *     "devMsg": String,
 *     "userMsg": String
 * }
 */
router.patch('/restaurant/:restaurantId/stripeAccount', AuthMiddleware, (req, res, next) => {
	RestaurantController.updateStripeAccount(req, res, next)
});

module.exports = router;