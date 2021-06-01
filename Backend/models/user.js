const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	userName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: 'New User',
	},
	posts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Posts',
		},
	],
});

module.exports = mongoose.model('User', userSchema);
