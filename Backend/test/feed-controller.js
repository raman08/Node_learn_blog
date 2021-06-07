/* eslint-disable no-undef */
const { expect } = require('chai');
const mongoose = require('mongoose');

const User = require('../models/user');
const feedController = require('../controller/feed');

describe('Feed Controller', () => {
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

	it('Should add a created post to post object of user', done => {
		const req = {
			body: {
				title: 'Test Post',
				content: 'This is a test Post',
			},
			file: { path: 'this/is/dummy.path' },
			userId: '5f88592a06c05e4de90d0bc9',
		};

		res = {
			status: function () {
				return this;
			},
			json: function () {
				return this;
			},
		};

		feedController
			.postPost(req, res, () => {})
			.then(savedUser => {
				expect(savedUser).to.have.property('posts');
				expect(savedUser.posts).to.have.length(1);
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
