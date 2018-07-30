# NodeJS/ExpressJS API

## Install NodeJs on Ubuntu via NVM

`sudo apt-get update`

`sudo apt-get install build-essential libssl-dev`

`curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | sh`

`source ~/.profile`

Optional `nvm ls-remote` to view the NodeJs available versions

`nvm install 8.9.3` Installs the selected version


### Dependencies

`npm install nodemon -g`

`npm install apidoc -g`

`npm install`



## RUN

First of all, to build the docs, run:

`npm run docs`

Then you can start the server with Nodemon, which will perform restarts whenever you save a file:

`nodemon`



### Lifescyle

*Route*:

- Requested by clients

- Calls a Controller

- Many Routes can call the same Controller


*Auth Middleware*:

- Checks the Authorization header

- Decodes the token and authorizes the user

- Returns an error, or passes control to the relevant controller


*Controller*:

- Checks that the user has the required role permissions to access the route

- Checks that all required request parameters are provided

- Checks that the user has admin or resource ownership permissions

- Calls a Service

- Specifies and sends the response


*Service*:

- Business logic

- Calls Entities, Helpers and other Services


*Helpers*:

- Perform a small task

- Abstract methods


*Entity*:

- Database queries