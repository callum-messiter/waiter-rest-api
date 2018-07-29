define({ "api": [
  {
    "type": "get",
    "url": "/auth/accessToken",
    "title": "AccessToken",
    "group": "Auth",
    "version": "3.0.0",
    "name": "AccessToken",
    "description": "<p>After logging in, the API will return a long-lived <code>refreshToken</code> and a short-lived <code>accessToken</code>. Any other API calls should be made with the <code>accessToken</code> until it expires, when it does expire the client must send a request to this endpoint, providing the previously generated <code>refreshToken</code> in order to obtain a new <code>accessToken</code>.</p> <p>A <code>401</code> response means that the <code>refreshToken</code> has also expired and the user needs to log in again.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "refreshToken",
            "description": "<p>Token that you previously obtained when logging in</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n\t\"tokenType\": \"Bearer\",\n\t\"accessToken\": String,\n\t\"expiresInSeconds\": Int,\n\t\"refreshToken\": String,\n\t\"userId\": String,\n\t\"roleId\": Int\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "InvalidToken (401):",
          "content": "{\n\t\"code\": \"Unauthorized\",\n\t\"message\": \"Auth_InvalidToken\"\n}",
          "type": "json"
        },
        {
          "title": "UnadaptableToken (401):",
          "content": "{\n\t\"code\": \"Unauthorized\",\n\t\"message\": \"Auth_UnadaptableToken\"\n}",
          "type": "json"
        },
        {
          "title": "ExpiredToken (401):",
          "content": "{\n\t\"code\": \"Unauthorized\",\n\t\"message\": \"Auth_ExpiredToken\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "C:/users/cal/desktop/waitr/waitr-api/router/AuthRouter.js",
    "groupTitle": "Auth",
    "groupDescription": "<p>Used by clients to retrieve an access token for users, which will be provided in all requests thereafter</p>",
    "sampleRequest": [
      {
        "url": "/api/auth/accessToken"
      }
    ]
  }
] });
