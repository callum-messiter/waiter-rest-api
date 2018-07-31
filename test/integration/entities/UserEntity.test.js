const UserEntity = require('../../../entities/UserEntity');
const shortId = require('shortid');
const moment = require('moment');
const db = require('../../../config/database');

const deleteTestUser = (userId) => {
	return new Promise((resolve, reject) => {
		const query = 'DELETE FROM users WHERE userId = ?';
		db.query(query, userId, (err, result) => {
			if(err) return resolve({ err: err });
			return resolve(result);
		});
	});
}

const getTestUser = (userId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE userId = ?';
		db.query(query, userId, (err, data) => {
			if(err) return resolve(err);
			return resolve(data);
		});
	});
}

describe('createNewUser', () => {
	const userId = shortId.generate().concat('_test');
	const userObj = {
		userId: userId,
		email: 'testEmail',
		password: 'testPassword1',
		firstName: 'testFName',
		lastName: 'testLName'
	};

	context('when receives a complete, valid User object as argument', () => {
		it('should return an SQL result with 1 affected row', async () => {
			after('check new user row and delete', async () => {
				const user = await getTestUser(userId);
				if(user.err) return user.err
				user.should.be.an('array').with.lengthOf(1);
				user[0].userId.should.equal(userObj.userId);
				user[0].email.should.equal(userObj.email);
				user[0].firstName.should.equal(userObj.firstName);
				user[0].lastName.should.equal(userObj.lastName);
				user[0].active.should.equal(1);
				user[0].verified.should.equal(0);

			    const del = await deleteTestUser(userId);
			    if(del.err) return user.err;
			    return;
			});

			const create = await UserEntity.createNewUser(userObj);
			create.should.have.property('affectedRows');
			create.affectedRows.should.equal(1);
		});
	});
});