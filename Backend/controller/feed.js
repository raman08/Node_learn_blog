const path = require('path');
const fs = require('fs');

const { validationResult } = require('express-validator');

const Post = require('../models/post');

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
			res
				.status(200)
				.json({
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

	const post = new Post({
		title: title,
		content: content,
		imageUrl: req.file.path,
		creator: {
			name: 'Raman',
		},
	});

	post
		.save()
		.then(result => {
			res.status(201).json({
				message: '[SUCCESS] Post created sucessfully',
				post: result,
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
			// Authantication of user

			clearImage(post.imageUrl);
			return Post.findByIdAndRemove(postId);
		})
		.then(result => {
			console.log(result);
			res.status(200).json({ message: '[SUCCESS] Post Deleted!' });
		})
		.catch(err => next(err));
};
const clearImage = filePath => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, err => {
		if (err) {
			console.log(err);
		}
	});
};
