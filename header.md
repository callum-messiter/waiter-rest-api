------------------

# Authentication

The Waitr REST API uses the OAuth 2.0 protocol to authorize calls. OAuth is an open standard that many companies use to provide secure access to protected resources.

After a user successfully logs in, the `token` field in the Login response contains an authentication token:

```
{  
    "user": {  
        "userId": String,
        "firstName": String,
        "lastName": String,
        "email": String,
        "role": Int,
        "token": String
    },
    ...
}
```


You must include this token in API requests in the Authorization header.

This sample request uses a bearer token to list user details:

```
curl -X GET http://localhost:3000/restaurant/:restaurantId \
  -H "Content-Type:application/json" \
  -H "Authorization: {token}"
```

Soon the API will be updated to comply fully with the OAuth 2.0 protocol, with the use of access and refresh tokens.


.
# API Requests

To construct a REST API request, combine these components:


- The HTTP method:

  - `GET` Requests data from a resource.

  - `POST` Submits data to a resource to process.

  - `PUT` Updates a resource.

  - `PATCH` Partially updates a resource.

  - `DELETE` Deletes a resource.


- The URL to the API service: `http://api.waitr.live`

- The URI to the resource: `/restaurant`

- Query parameters: Optional. Controls which data appears in the response. Use to filter, limit the size of, and sort the data in an API response.

- HTTP request headers: Includes the Authorization header with the authentication token.

- A JSON request body: Required for most GET, POST, PUT, and PATCH calls.


This is a simple request to update a user's first name:

```
curl -X PATCH http://localhost/user/{userId} \
  -H "Content-Type:application/json" \
  -H "Authorization: {token}" \
  -d '{
    "firstName": "John"
  }'
```


## Query Parameters

For some REST GET calls, you can specify one or more optional query parameters on the request URI to filter, limit the size of, and sort the data in an API response. For filter parameters, see the individual GET calls.

For example, the Order List API returns only orders that have not yet been resolved:

```
curl -X GET http://localhost:3000/order/:ownerId?liveOnly=true \
  -H "Content-Type:application/json" \
  -H "Authorization: {token}" \
```

.


# API Responses

Waitr API calls return HTTP status codes. Some API calls also return JSON response bodies that include information about the resource.


## HTTP status codes

Each REST API request returns a success or error HTTP status code.


### Success

In the responses, the API returns these HTTP status codes for successful requests:

- `200 OK`: The request succeeded.

- `201 Created`: A `POST` method successfully created a resource. If the resource was already created by a previous execution of the same method, for example, the server returns the HTTP `200 OK` status code.

- `202 Accepted`: The server accepted the request and will execute it later..

- `204 No Content`: The server successfully executed the method but returns no response body.


### Error

In the responses for failed requests, the API returns HTTP `4XX` or `5XX` status codes.

For all errors, the API returns an error response body that includes additional error details in this format:

```
{
    "statusCode": 404,
    "errorKey": "restaurantNotFound",
    "type": "_restaurant",
    "devMsg": String,
    "userMsg": String
}
```

There are a number of errors that can be returned by any API endpoint, and thus they will not be specified in the individual documentation blocks, but rather here:

```
{
    "statusCode": 400,
    "errorKey": "missingRequiredParams",
    "type": "_auth",
    "devMsg": String,
    "userMsg": String
}
```

```
{
    "statusCode": 400,
    "errorKey": "missingRequiredHeaders",
    "type": "_auth",
    "devMsg": String,
    "userMsg": String
}

```

```
{
    "statusCode": 403,
    "errorKey": "insufficientRolePrivileges",
    "type": "_auth",
    "devMsg": String,
    "userMsg": String
}
```

```
{
    "statusCode": 403,
    "errorKey": "insufficientPermissions",
    "type": "_auth",
    "devMsg": String,
    "userMsg": String
}
```

```
{
    "statusCode": 500,
    "errorKey": "internalServerError",
    "type": "_unhandled",
    "devMsg": String,
    "userMsg": String
}
```

In the responses, the API returns these HTTP status codes for failed requests:

- `400 Bad Request`: The server could not understand the request. 

- `401 Unauthorized`: The request requires authentication and the caller did not provide valid credentials.

- `403 Forbidden`: The client is not authorized to access this resource although it might have valid credentials

- `404 Not Found`: The server did not find anything that matches the request URI. Either the URI is incorrect or the resource is not available.

- `405 Method Not Allowed`: The service does not support the requested HTTP method. For example, `PATCH`.

- `500 Internal Server Error`: A system or application error occurred. Although the client appears to provide a correct request, something unexpected occurred on the server.

- `503 Service Unavailable`: The server cannot handle the request for a service due to temporary maintenance.
