const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
	createUser: async ({ userInput }, req) => {
		const validationErrors = [];

		if (!validator.isEmail(userInput.email)) {
			validationErrors.push({
				message: 'Invalid Email!',
				field: 'email',
			});
		}

		if (
			validator.isEmpty(userInput.password) ||
			!validator.isLength(userInput.password, { min: 5 })
		) {
			validationErrors.push({
				message: 'Invalid password!',
				field: 'password',
			});
		}

		if (validationErrors.length > 0) {
			const err = new Error('[ERROR] Invalid Input!');
			err.data = validationErrors;
			err.errorCode = 422;
			throw err;
		}

		const existingUser = await User.findOne({ email: userInput.email });

		if (existingUser) {
			const err = new Error('[ERROR] User Already Exist!');
			throw err;
		}
		const hashPassword = await bcrypt.hash(userInput.password, 12);

		const user = new User({
			name: userInput.name,
			email: userInput.email,
			password: hashPassword,
		});

		const storedUser = await user.save();

		return { ...storedUser._doc, _id: storedUser._id.toString() };
	},

	login: async ({ email, password }, req) => {
		const user = await User.findOne({ email: email });

		if (!user) {
			const err = new Error('Email or Password incorrect!');
			err.errorCode = 401;
			throw err;
		}

		const isEqual = await bcrypt.compare(password, user.password);

		if (!isEqual) {
			const err = new Error('Email or Password incorrect!');
			err.errorCode = 401;
			throw err;
		}

		const token = jwt.sign(
			{
				userId: user._id,
				email: user.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);

		return { token: token, userId: user._id.toString() };
	},

	createPost: async ({ postInput }, req) => {
		if (!req.isAuth) {
			const err = new Error('User not authenticated!');
			err.errorCode = 401;
			throw err;
		}

		const validationErrors = [];

		if (
			validator.isEmpty(postInput.title) ||
			!validator.isLength(postInput.title, { min: 3 })
		) {
			validationErrors.push({
				message: 'Invalid Title!',
				field: 'title',
			});
		}

		if (
			validator.isEmpty(postInput.content) ||
			!validator.isLength(postInput.content, { min: 5 })
		) {
			validationErrors.push({
				message: 'Invalid content!',
				field: 'content',
			});
		}

		if (
			validator.isEmpty(postInput.imageUrl)
			// validator.isUrl(postInput.imageUrl)
		) {
			validationErrors.push({
				message: 'Invalid image Url!',
				field: 'imageUrl',
			});
		}

		if (validationErrors.length > 0) {
			const err = new Error('[ERROR] Invalid Input!');
			err.data = validationErrors;
			err.errorCode = 422;
			throw err;
		}

		const user = await User.findById(req.userId);
		if (!user) {
			const err = new Error('Invalid User!');
			err.errorCode = 401;
			throw err;
		}

		const post = new Post({
			title: postInput.title,
			content: postInput.content,
			imageUrl: postInput.imageUrl,
			creator: user,
		});

		const createdPost = await post.save();

		user.posts.push(post);
		await user.save();

		return {
			...createdPost._doc,
			_id: createdPost._id.toString(),
			createdAt: createdPost.createdAt.toISOString(),
			updatedAt: createdPost.updatedAt.toISOString(),
		};
	},

	posts: async req => {
		// if (!req.isAuth) {
		// 	const err = new Error('User not authenticated!');
		// 	err.errorCode = 401;
		// 	throw err;
		// }

		const totalPosts = await Post.find().countDocuments();

		const posts = await Post.find()
			.populate('creator', '_id name')
			.sort({ createdAt: -1 });

		return {
			posts: posts.map(p => {
				return {
					...p._doc,
					_id: p._id.toString(),
					createdAt: p.createdAt.toISOString(),
					updatedAt: p.updatedAt.toISOString(),
				};
			}),
			totalPosts: totalPosts,
		};
	},
};
