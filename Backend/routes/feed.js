const express = require('express');
const { body } = require('express-validator');

const feedController = require('../controller/feed');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/posts', isAuth, feedController.getPosts);

router.post(
	'/posts',
	[
		body('title')
			.trim()
			.isLength({ min: 5 })
			.withMessage('Title should have minimum length of 5'),
		body('content')
			.trim()
			.isLength({ min: 5 })
			.isString()
			.withMessage('Title should have minimum length of 5'),
	],
	feedController.postPost
);

router.get('/post/:postId', feedController.getPost);

router.put(
	'/post/:postId',
	[
		body('title')
			.trim()
			.isLength({ min: 5 })
			.withMessage('Title should have minimum length of 5'),
		body('content')
			.trim()
			.isLength({ min: 5 })
			.isString()
			.withMessage('Title should have minimum length of 5'),
	],
	feedController.editPost
);

router.delete('/post/:postId', feedController.deletePost);

module.exports = router;
