const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const { clearImage } = require('../utils/utils');

exports.getPosts = (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;
	let totalItems;

	Post.find()
		.countDocuments()
		.then(total => {
			totalItems = total;
			return Post.find()
				.skip((currentPage - 1) * perPage)
				.limit(perPage);
		})
		.then(posts => {
			res.status(200).json({
				message: '[POST] Post Found Sucessfully',
				posts: posts,
				totalItems: totalItems,
			});
		})
		.catch(err => next(err));
};

exports.postPost = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const error = new Error(
			'[ERROR] Validation Failed!, Incorrect Data formate'
		);
		error.statusCode = 422;
		throw error;
	}

	if (!req.file) {
		const error = new Error('[ERROR] No image provided');
		error.statusCode = 422;
		throw error;
	}
	const { title, content } = req.body;
	let creator;

	const post = new Post({
		title: title,
		content: content,
		imageUrl: req.file.path,
		creator: req.userId,
	});

	post
		.save()
		.then(() => {
			return User.findById(req.userId);
		})
		.then(user => {
			if (!user) {
				const error = new Error('[ERROR] Something went wrong!');
				error.statusCode = 500;
				throw error;
			}

			creator = user;
			user.posts.push(post);
			return user.save();
		})
		.then(() => {
			res.status(201).json({
				message: '[SUCCESS] Post created sucessfully',
				post: post,
				creator: {
					_id: creator._id,
					userName: creator.userName,
				},
			});
		})
		.catch(err => {
			next(err);
		});
};

exports.getPost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error('[ERROR] No post found!');
				error.statusCode = 404;
				throw error;
			}

			res
				.status(200)
				.json({ message: '[POST] Post Found Sucessfully', post: post });
		})
		.catch(err => next(err));
};

exports.editPost = (req, res, next) => {
	const postId = req.params.postId;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const error = new Error(
			'[ERROR] Validation Failed!, Incorrect Data formate'
		);
		error.statusCode = 422;
		throw error;
	}

	const { title, content } = req.body;
	let imageUrl = req.body.image;

	if (req.file) {
		imageUrl = req.file.path;
	}

	if (!imageUrl) {
		const error = new Error('[ERROR] No image found!');
		error.statusCode = 422;
		throw error;
	}

	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error('[ERROR] No post Found!');
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error('[ERROR] Not Authorized!');
				error.statusCode = 403;
				throw error;
			}
			if (imageUrl !== post.imageUrl) {
				clearImage(post.imageUrl);
			}

			post.title = title;
			post.content = content;
			post.imageUrl = imageUrl;
			return post.save();
		})
		.then(result => {
			res
				.status(200)
				.json({ message: '[SUCCESS] Post Updated Sucessfully!', post: result });
		})
		.catch(err => next(err));
};

exports.deletePost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error('[ERROR] No post found!');
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error('[ERROR] Not Authorized!');
				error.statusCode = 403;
				throw error;
			}
			clearImage(post.imageUrl);
			return Post.findByIdAndRemove(postId);
		})
		.then(() => {
			return User.findById(req.userId);
		})
		.then(user => {
			user.posts.pull(postId);
			user.save();
		})
		.then(() => {
			res.status(200).json({ message: '[SUCCESS] Post Deleted!' });
		})
		.catch(err => next(err));
};
