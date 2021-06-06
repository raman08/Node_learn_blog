/* eslint-disable no-undef */
const { expect } = require('chai');
const sinon = require('sinon');

const User = require('../models/user');
const authController = require('../controller/auth');

describe('Auth Controller - Login', () => {
	it('Shoould throw an error with status 500 if accessing database fails', done => {
		sinon.stub(User, 'findOne');
		User.findOne.throws();

		const req = {
			body: {
				email: 'test@test.com',
				password: 'test@123',
			},
		};

		authController
			.login(req, {}, () => {})
			.then(result => {
				console.log(result);
				expect(result).to.be.an('error');
				expect(result).to.have.property('statuscode', 500);
			});

		User.findOne.restore();
	});
});
