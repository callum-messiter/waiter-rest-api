define({ "api": [
  {
    "type": "get",
    "url": "/auth/login",
    "title": "Login",
    "group": "Auth",
    "permission": [
      {
        "name": "diner, restaurateur, internalAdmin, externalAdmin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>The user's email address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>The user's password</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success 200",
          "content": "{\n    \"success\": true,\n    \"error\": \"\",\n    \"data\": {\n        \"userId\": 1,\n        \"role\": 200,\n        \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGdvcml0aG0iOiJIUzI1NiIsImlzc3VlciI6Imh0dHA6Ly9hcGkud2FpdGVyLmNvbSIsImlhdCI6MTUwNzk5MzM4MzkyNSwiZXhwIjoxNTA4NTk4MTgzOTI1LCJ1c2VySWQiOjEsInVzZXJSb2xlIjoyMDB9.qD1TEz1I0hn1jBtekPEpNJjoLCmMxSiB-Ik4DzRI2E0\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "401 Invalid login credentials",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_login_credentials\",\n    \"msg\": \"The email-password combination does not exist in the database.\"\n}",
          "type": "json"
        },
        {
          "title": "403 The user account is not active",
          "content": "{\n    \"success\": false,\n    \"error\": \"user_not_active\",\n    \"msg\": \"This user account is inactive. The account was either suspended by waiter, or deactivated by the user.\"\n}",
          "type": "json"
        },
        {
          "title": "403 The user account is not verified",
          "content": "{\n    \"success\": false,\n    \"error\": \"user_not_verified\",\n    \"msg\": \"This user account is not verified. The user should have a verification email in the inbox of their registered email account. If not, request another one.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Missing query-string parameters",
          "content": "{\n    \"success\": false,\n    \"error\": \"missing_required_params\",\n    \"msg\": \"The request must contain an email address and password.\"\n}",
          "type": "json"
        },
        {
          "title": "500 doesUserExist (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"get_user_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 checkPassword (bcrypt) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"bcrypt_error\",\n    \"msg\": // bycrpt error key/message\n}",
          "type": "json"
        },
        {
          "title": "500 getUserRole (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"get_user_role_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 createUserToken (jwt) error",
          "content": "{\n    \"success\": false,\n    \"error\": 'jwt_error',\n    \"msg\": // jwt error message - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 createUserToken (jwt) error",
          "content": "{\n    \"success\": false,\n    \"error\": 'jwt_token_null',\n    \"msg\": \"The server could not create a unique token.\"\n}",
          "type": "json"
        },
        {
          "title": "500 saveUserTokenReference (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": 'token_not_added_to_db',\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/AuthController.js",
    "groupTitle": "Auth",
    "name": "GetAuthLogin",
    "sampleRequest": [
      {
        "url": "/api/auth/login"
      }
    ]
  },
  {
    "type": "get",
    "url": "/auth/logout",
    "title": "Logout",
    "group": "Auth",
    "description": "<p>If the API returns a 200 OK response, the client application should destroy the user's token</p>",
    "permission": [
      {
        "name": "diner, restaurateur, internalAdmin, externalAdmin"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The user access token provided by the API upon successful login</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>The id of the user, which should be provided to the client app by the api upon login, and stored locally</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success 200",
          "content": "{\n    \"success\": true,\n    \"error\": \"\",\n    \"data\": {}\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "401 Invalid token",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_token\",\n    \"msg\": \"The server determined that the token provided in the request is invalid. It likely expired - try logging in again.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Mandatory request data missing",
          "content": "{\n    \"success\": false,\n    \"error\": \"missing_required_data\",\n    \"msg\": \"The server was expecting a userId and a token. At least one of these parameters was missing from the request.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Error deleting token reference from db",
          "content": "{\n    \"success\": false,\n    \"error\": \"error_deleting_token_ref\",\n    \"msg\": \"The server executed the query successfully, but nothing was deleted. It's likely that userId-token combination provided does not exist in the database.\"\n}",
          "type": "json"
        },
        {
          "title": "500 deleteTokenReferenence (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"deleting_token_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/AuthController.js",
    "groupTitle": "Auth",
    "name": "GetAuthLogout",
    "sampleRequest": [
      {
        "url": "/api/auth/logout"
      }
    ]
  },
  {
    "type": "post",
    "url": "/category/create/:menuId",
    "title": "CreateNewCategory",
    "group": "Category",
    "description": "<p>Add a new menu category to an existing menu</p>",
    "permission": [
      {
        "name": "restaurateur, internalAdmin, externalAdmin"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The user access token provided by the API upon successful login</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "menuId",
            "description": "<p>The id of the menu to which the category should be added</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success 200",
          "content": "{\n    \"success\": true,\n    \"error\": \"\",\n    \"data\": {\n        \"createdCategoryId\": 3\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "401 Invalid token",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_token\",\n    \"msg\": \"The server determined that the token provided in the request is invalid. It likely expired - try logging in again.\"\n}",
          "type": "json"
        },
        {
          "title": "401 Unauthorised: not resource owner",
          "content": "{\n    \"success\": false,\n    \"error\": \"unauthorised\",\n    \"msg\": \"A menu can be modified only by the menu owner.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Mandatory request data missing",
          "content": "{\n    \"success\": false,\n    \"error\": \"request_data_missing\",\n    \"msg\": \"The server was expecting an 'authorization' header and a menuId. At least one of these params was missing.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Mandatory request params missing",
          "content": "{\n    \"success\": false,\n    \"error\": \"missing_required_params\",\n    \"msg\": \"The server was expecting a category name.\"\n}",
          "type": "json"
        },
        {
          "title": "404 ownerId not found",
          "content": "{\n    \"success\": false,\n    \"error\": \"ownerId_not_found\",\n    \"msg\": \"The query returned zero results. It is likely that a menu with the specified ID does not exist.\"\n}",
          "type": "json"
        },
        {
          "title": "422 Invalid request parameter",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_data_param\",\n    \"msg\": \"The data parameter 'dodgyParam' is not a valid parameter for the resource in question.\"\n}",
          "type": "json"
        },
        {
          "title": "500 getMenuOwnerId (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"get_menu_owner_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 createNewCategory (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"create_category_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/CategoryController.js",
    "groupTitle": "Category",
    "name": "PostCategoryCreateMenuid",
    "sampleRequest": [
      {
        "url": "/api/category/create/:menuId"
      }
    ]
  },
  {
    "type": "post",
    "url": "/category/deactivate/:categoryId",
    "title": "DeactivateCategory",
    "group": "Category",
    "description": "<p>Deactivate a category such that it becomes invisible. It can be restored later, if necessary</p>",
    "permission": [
      {
        "name": "restaurateur, internalAdmin, externalAdmin"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The user access token provided by the API upon successful login</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "categoryId",
            "description": "<p>The id of the category to be deactivated</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success 200",
          "content": "{\n    \"success\": true,\n    \"error\": \"\",\n    \"data\": {}\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "401 Invalid token",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_token\",\n    \"msg\": \"The server determined that the token provided in the request is invalid. It likely expired - try logging in again.\"\n}",
          "type": "json"
        },
        {
          "title": "401 Unauthorised: not resource owner",
          "content": "{\n    \"success\": false,\n    \"error\": \"unauthorised\",\n    \"msg\": \"A category can be deactivated  only by the category (menu) owner.\"\n}",
          "type": "json"
        },
        {
          "title": "404 ownerId not found",
          "content": "{\n    \"success\": false,\n    \"error\": \"ownerId_not_found\",\n    \"msg\": \"The query returned zero results. It is likely that a category with the specified ID does not exist.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Mandatory request data missing",
          "content": "{\n    \"success\": false,\n    \"error\": \"request_data_missing\",\n    \"msg\": \"The server was expecting an 'authorization' header and a categoryId. At least one of these params was missing.\"\n}",
          "type": "json"
        },
        {
          "title": "422 Invalid request parameter",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_data_param\",\n    \"msg\": \"The data parameter 'dodgyParam' is not a valid parameter for the resource in question.\"\n}",
          "type": "json"
        },
        {
          "title": "500 getCategoryOwnerId (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"get_category_owner_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 deactivateCategory (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"update_category_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/CategoryController.js",
    "groupTitle": "Category",
    "name": "PostCategoryDeactivateCategoryid",
    "sampleRequest": [
      {
        "url": "/api/category/deactivate/:categoryId"
      }
    ]
  },
  {
    "type": "post",
    "url": "/category/update/:categoryId",
    "title": "UpdateCategory",
    "group": "Category",
    "description": "<p>Update the name and/or description of an existing category</p>",
    "permission": [
      {
        "name": "restaurateur, internalAdmin, externalAdmin"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The user access token provided by the API upon successful login</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "categoryId",
            "description": "<p>The id of the category to be updated</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success 200",
          "content": "{\n    \"success\": true,\n    \"error\": \"\",\n    \"data\": {}\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "401 Invalid token",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_token\",\n    \"msg\": \"The server determined that the token provided in the request is invalid. It likely expired - try logging in again.\"\n}",
          "type": "json"
        },
        {
          "title": "401 Unauthorised: not resource owner",
          "content": "{\n    \"success\": false,\n    \"error\": \"unauthorised\",\n    \"msg\": \"A category can be modified only by the category (menu) owner.\"\n}",
          "type": "json"
        },
        {
          "title": "404 ownerId not found",
          "content": "{\n    \"success\": false,\n    \"error\": \"ownerId_not_found\",\n    \"msg\": \"The query returned zero results. It is likely that a menu with the specified ID does not exist.\"\n}",
          "type": "json"
        },
        {
          "title": "404 Mandatory request data missing",
          "content": "{\n    \"success\": false,\n    \"error\": \"request_data_missing\",\n    \"msg\": \"The server was expecting an 'authorization' header and a categoryId. At least one of these params was missing.\"\n}",
          "type": "json"
        },
        {
          "title": "422 Invalid request parameter",
          "content": "{\n    \"success\": false,\n    \"error\": \"invalid_data_param\",\n    \"msg\": \"The data parameter 'dodgyParam' is not a valid parameter for the resource in question.\"\n}",
          "type": "json"
        },
        {
          "title": "500 getCategoryOwnerId (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"get_category_owner_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        },
        {
          "title": "500 updateCategoryDetails (SQL) error",
          "content": "{\n    \"success\": false,\n    \"error\": \"update_category_query_error\",\n    \"msg\": // sql SNAKE_CASE error key - report to the api dev\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/CategoryController.js",
    "groupTitle": "Category",
    "name": "PostCategoryUpdateCategoryid",
    "sampleRequest": [
      {
        "url": "/api/category/update/:categoryId"
      }
    ]
  }
] });
