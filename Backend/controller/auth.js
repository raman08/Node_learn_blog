const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

exports.login = (req, res, next) => {
	const { email, password } = req.body;
	let userDoc;
	User.findOne({ email: email })
		.then(user => {
			if (!user) {
				const error = new Error("[ERROR] Email or password doesn't match");
				error.statusCode = 401;
				throw error;
			}
			userDoc = user;
			return bcrypt.compare(password, user.password);
		})
		.then(isEqual => {
			if (!isEqual) {
				const error = new Error("[ERROR] Email or password doesn't match");
				error.statusCode = 401;
				throw error;
			}
			const token = jwt.sign(
				{
					email: userDoc.email,
					userId: userDoc._id.toString(),
				},
				process.env.JWT_SECRET,
				{ expiresIn: '1h' }
			);

			res.status(200).json({ token: token, userId: userDoc._id.toString() });
		})
		.catch(err => next(err));
};
