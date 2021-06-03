const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

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
};
