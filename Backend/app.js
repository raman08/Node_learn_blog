const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

require('dotenv').config();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, `${new Date().toISOString()}-${file.originalname}`);
	},
});

const filefileter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/jpg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json());
app.use(
	multer({ storage: fileStorage, fileFilter: filefileter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

const PORT = process.env.NODE_PORT;

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	next();
});

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
	console.log(error);
	const { message, statusCode } = error;
	res.status(statusCode).json({ message: message });
});

mongoose
	.connect(process.env.MONGOOSE_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		app.listen(PORT, () => {
			console.log(`[START] http://localhost:${PORT}`);
		});
	})
	.catch(err => {
		console.log(err);
	});
