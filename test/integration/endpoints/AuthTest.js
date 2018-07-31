const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../server');
const should = chai.should();
const e = require('../../../helpers/ErrorHelper').errors;

chai.use(chaiHttp);

const loginRoute = '/auth/login';
async function loginRequest(queryStr) {
	return new Promise((resolve, reject) => {
		chai.request(server)
	    .get(loginRoute.concat(queryStr))
	    .end((err, res) => {
	    	if(err) {
	    		return resolve(err);
	    	}
	    	return resolve(res);
	    });
	});
}

describe(loginRoute, () => {
	context('when email or password query params are missing', () => {
		it('should return `missingRequiredParams` error', async () => {
			const email = 'email';
			const queryStr = `?email=${email}`;
			const result = await loginRequest(queryStr);
			result.should.have.status(e.missingRequiredParams.statusCode);
	 		result.body.errorKey.should.equal(e.missingRequiredParams.errorKey);
		});

		it('should return `missingRequiredParams` error', async () => {
			const password = 'password';
			const queryStr = `?password=${password}`;
			const result = await loginRequest(queryStr);
	    	result.should.have.status(e.missingRequiredParams.statusCode);
	 		result.body.errorKey.should.equal(e.missingRequiredParams.errorKey);
		});
	});

	context('when provided email does not match any registered account', () => {
		it('should return `emailNotRegistered` error', async () => {
			const email = 'nonexistentemail';
			const password = 'password';
			const queryStr = `?email=${email}&password=${password}`;
			const result = await loginRequest(queryStr);
	    	result.should.have.status(e.emailNotRegistered.statusCode);
	 		result.body.errorKey.should.equal(e.emailNotRegistered.errorKey);
		});
	});

	context('when the provided password does not match the DB record', () => {
		it('should return `passwordIncorrect` error', async () => {
			const email = 'callum.messiter@gmail.com';
			const password = 'incorrectPassword';
			const queryStr = `?email=${email}&password=${password}`;
			const result = await loginRequest(queryStr);
	    	result.should.have.status(e.passwordIncorrect.statusCode);
	 		result.body.errorKey.should.equal(e.passwordIncorrect.errorKey);
		});
	});

	/*
	context('when valid login credentials are provided', () => {
		// Create user, then delete it after test
		it('should return a 200 response with the user object', async () => {
			const email = 'callum.messiter@gmail.com';
			const password = 'callum';
			const queryStr = `?email=${email}&password=${password}`;
			const result = await loginRequest(queryStr);
	    	result.should.have.status(200);
	 		result.body.should.property('user');
	 		result.body.should.property('restaurant');
	 		result.body.should.property('menu');
	 		result.body.user.should.have.property('userId');
	 		result.body.user.should.have.property('firstName');
	 		result.body.user.should.have.property('lastName');
	 		result.body.user.should.have.property('email');
	 		result.body.user.should.have.property('role');
	 		result.body.user.should.have.property('token');
	 		result.body.restaurant.should.have.property('restaurantId');
	 		result.body.restaurant.should.have.property('name');
	 		result.body.restaurant.should.have.property('isStripeAccountVerified');
	 		result.body.menu.should.have.property('menuId');
	 		result.body.menu.should.have.property('name');
		});
	});
	*/
});