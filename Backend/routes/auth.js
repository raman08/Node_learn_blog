const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controller/auth');

const router = express.Router();

router.put(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please Enter A valid E-Mail!')
			.custom(value => {
				return User.findOne({ email: value }).then(userDoc => {
					if (userDoc) {
						return Promise.reject('E-mail already Exist!');
					}
				});
			})
			.normalizeEmail(),
		body('password')
			.trim()
			.isLength({ min: 6 })
			.withMessage('Password must of min 6 chracter long!'),
	],
	authController.signup
);

router.post('/login', authController.login);

module.exports = router;
