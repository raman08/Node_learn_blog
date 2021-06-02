const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validationResult } = require('express-validator');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
	const validationErrors = validationResult(req);
	if (!validationErrors.isEmpty()) {
		const error = new Error('[ERROR] Validation Failed!');
		error.statusCode = 422;
		error.data = validationErrors.array();
		throw error;
	}
	const { email, userName, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = User({
			email: email,
			userName: userName,
			password: hashedPassword,
		});
		const result = await user.save();

		res
			.status(201)
			.json({ message: '[SUCCESS] User created!', userId: result._id });
	} catch (err) {
		next(err);
	}
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email: email });

		if (!user) {
			const error = new Error("[ERROR] Email or password doesn't match");
			error.statusCode = 401;
			throw error;
		}

		const isEqual = await bcrypt.compare(password, user.password);

		if (!isEqual) {
			const error = new Error("[ERROR] Email or password doesn't match");
			error.statusCode = 401;
			throw error;
		}

		const token = jwt.sign(
			{
				email: user.email,
				userId: user._id.toString(),
			},
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);

		res.status(200).json({
			message: '[SUCCESS] User authanticated',
			token: token,
			userId: user._id.toString(),
		});
	} catch (err) {
		next(err);
	}
};
