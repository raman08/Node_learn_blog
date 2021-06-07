const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const { clearImage } = require('../utils/utils');

exports.getPosts = async (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;

	try {
		const totalItems = await Post.find().countDocuments();

		const posts = await Post.find()
			.skip((currentPage - 1) * perPage)
			.limit(perPage);

		res.status(200).json({
			message: '[POST] Post Found Sucessfully',
			posts: posts,
			totalItems: totalItems,
		});
	} catch (err) {
		next(err);
	}
};

exports.postPost = async (req, res, next) => {
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

	try {
		await post.save();

		const user = await User.findById(req.userId);

		if (!user) {
			const error = new Error('[ERROR] Something went wrong!');
			error.statusCode = 500;
			throw error;
		}

		creator = user;
		user.posts.push(post);
		const saveedUser = await user.save();

		res.status(201).json({
			message: '[SUCCESS] Post created sucessfully',
			post: post,
			creator: {
				_id: creator._id,
				userName: creator.userName,
			},
		});

		return saveedUser;
	} catch (err) {
		next(err);
	}
};

exports.getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('[ERROR] No post found!');
			error.statusCode = 404;
			throw error;
		}

		res
			.status(200)
			.json({ message: '[POST] Post Found Sucessfully', post: post });
	} catch (err) {
		next(err);
	}
};

exports.editPost = async (req, res, next) => {
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

	try {
		const post = await Post.findById(postId);

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

		const result = await post.save();

		res
			.status(200)
			.json({ message: '[SUCCESS] Post Updated Sucessfully!', post: result });
	} catch (err) {
		next(err);
	}
};

exports.deletePost = async (req, res, next) => {
	const postId = req.params.postId;

	try {
		const post = await Post.findById(postId);

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

		await Post.findByIdAndRemove(postId);

		const user = await User.findById(req.userId);

		user.posts.pull(postId);
		user.save();

		res.status(200).json({ message: '[SUCCESS] Post Deleted!' });
	} catch (err) {
		next(err);
	}
};
