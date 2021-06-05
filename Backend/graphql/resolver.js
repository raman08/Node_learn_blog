const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../utils/utils');

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

	posts: async ({ page }, req) => {
		if (!req.isAuth) {
			const err = new Error('User not authenticated!');
			err.errorCode = 401;
			throw err;
		}

		if (!page) {
			page = 1;
		}
		const perPage = 2;
		const totalPosts = await Post.find().countDocuments();

		const posts = await Post.find()
			.populate('creator', '_id name')
			.skip((page - 1) * perPage)
			.limit(perPage)
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

	post: async ({ id }, req) => {
		if (!req.isAuth) {
			const err = new Error('User not authenticated!');
			err.errorCode = 401;
			throw err;
		}

		const post = await Post.findById(id).populate('creator', 'name email');

		if (!post) {
			const err = new Error('No post found!');
			err.errorCode = 404;
			throw err;
		}

		return {
			...post._doc,
			_id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
		};
	},

	updatePost: async ({ id, postInput }, req) => {
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

		if (validationErrors.length > 0) {
			const err = new Error('[ERROR] Invalid Input!');
			err.data = validationErrors;
			err.errorCode = 422;
			throw err;
		}

		const post = await Post.findById(id).populate('creator');

		if (!post) {
			const err = new Error('No post found!');
			err.errorCode = 404;
			throw err;
		}

		if (post.creator._id.toString() !== req.userId.toString()) {
			const err = new Error('User not authorized');
			err.errorCode = 403;
			throw err;
		}

		post.title = postInput.title;
		post.content = postInput.content;

		if (postInput.imageUrl !== 'undefined') {
			post.imageUrl = postInput.imageUrl;
		}

		const createdPost = await post.save();

		return {
			...createdPost._doc,
			_id: createdPost._id.toString(),
			createdAt: createdPost.createdAt.toISOString(),
			updatedAt: createdPost.updatedAt.toISOString(),
		};
	},

	deletePost: async ({ id }, req) => {
		try {
			if (!req.isAuth) {
				const err = new Error('User not authenticated!');
				err.errorCode = 401;
				throw err;
			}

			const post = await Post.findById(id);

			if (!post) {
				const error = new Error('No post found!');
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId.toString()) {
				const error = new Error('UserNot Authorized!');
				error.statusCode = 403;
				throw error;
			}

			clearImage(post.imageUrl);

			await Post.findByIdAndRemove(id);

			const user = await User.findById(req.userId);

			user.posts.pull(id);
			await user.save();

			return true;
		} catch (err) {
			return false;
		}
	},

	user: async (args, req) => {
		if (!req.isAuth) {
			const err = new Error('User not authenticated!');
			err.errorCode = 401;
			throw err;
		}

		const user = await User.findById(req.userId);

		if (!user) {
			const error = new Error('No user found!');
			error.errorCode = 404;
			throw error;
		}

		return { ...user._doc, _id: user._id.toString() };
	},

	updateStatus: async ({ status }, req) => {
		if (!req.isAuth) {
			const err = new Error('User not authenticated!');
			err.errorCode = 401;
			throw err;
		}

		const user = await User.findById(req.userId);

		if (!user) {
			const err = new Error('User not found!');
			err.errorCode = 404;
			throw err;
		}
		if (validator.isEmpty(status)) {
			const err = new Error("Status can't be empty");
			err.errorCode = 403;
			throw err;
		}

		user.status = status;
		await user.save();

		return { ...user._doc, _id: user._id.toString() };
	},
};
