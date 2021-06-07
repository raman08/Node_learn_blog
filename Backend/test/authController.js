/* eslint-disable no-undef */
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const authController = require('../controller/auth');

describe('Auth Controller', () => {
	before(function (done) {
		mongoose
			.connect(
				'mongodb+srv://nodeBlogUser:SdNayj1WFnHy4X7P@nodeblog.cimyc.mongodb.net/BlogAppTest?retryWrites=true&w=majority',
				{
					useNewUrlParser: true,
					useUnifiedTopology: true,
					useFindAndModify: false,
				}
			)
			.then(() => {
				const user = new User({
					email: 'test@test.com',
					password: 'tester@0810',
					posts: [],
					userName: 'Test',
					_id: '5f88592a06c05e4de90d0bc9',
				});
				return user.save();
			})
			.then(() => {
				done();
			});
	});

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
				expect(result).to.be.an('error');
				expect(result).to.have.property('statusCode', 500);
				done();
			});

		User.findOne.restore();
	});

	it('Should send a status of valid user', done => {
		const req = { user: '5f88592a06c05e4de90d0bc9' };
		const res = {
			statusCode: 500,
			userStatus: null,
			status: function (code) {
				this.statusCode = code;
				return this;
			},
			json: function (data) {
				this.userStatus = data.status;
				return this;
			},
		};

		authController
			.getUserStatus(req, res, () => {})
			.then(() => {
				expect(res.statusCode).to.be.equal(200);

				done();
			});
	});

	after(function (done) {
		User.deleteMany({})
			.then(() => {
				return mongoose.disconnect();
			})
			.then(() => {
				done();
			});
	});
});
