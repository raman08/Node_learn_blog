const bcrypt = require('bcryptjs');

const { validationResult } = require('express-validator');

const User = require('../models/user');

exports.signup = (req, res, next) => {
	const validationErrors = validationResult(req);
	if (!validationErrors.isEmpty()) {
		const error = new Error('[ERROR] Validation Failed!');
		error.statusCode = 422;
		error.data = validationErrors.array();
		throw error;
	}
	const { email, userName, password } = req.body;

	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = User({
				email: email,
				userName: userName,
				password: hashedPassword,
			});

			return user.save();
		})
		.then(result => {
			res
				.status(201)
				.json({ message: '[SUCCESS] User created!', userId: result._id });
		})
		.catch(err => next(err));
};
