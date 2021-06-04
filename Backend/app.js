const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolver');
const auth = require('./middleware/auth');
const { clearImage } = require('./utils/utils');

require('dotenv').config();

const app = express();

// Multer Settings
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

app.use(bodyParser.json());
app.use(
	multer({ storage: fileStorage, fileFilter: filefileter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

const PORT = process.env.NODE_PORT || 8080;

// CORS Setting
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use(auth);

app.use('/post-image', (req, res, next) => {
	if (!req.file) {
		return res.status(200).json({ message: 'No image Found!' });
	}

	if (req.body.oldPath) {
		clearImage(req.body.oldPath);
	}

	return res.status(201).json({
		message: 'Image stored Sucessfully!',
		filePath: req.file.path,
	});
});

app.use(
	'/graphql',
	graphqlHTTP({
		schema: graphqlSchema,
		rootValue: graphqlResolver,
		graphiql: true,
		customFormatErrorFn: err => {
			if (!err.originalError) {
				return err;
			}
			const message = err.message;
			const errorCode = err.originalError.errorCode || 500;
			const data = err.originalError.data;

			return { message: message, errorCode: errorCode, data: data };
		},
	})
);

// Error handeling function
app.use((error, req, res, next) => {
	console.log(error);
	const { message, statusCode, data } = error;
	res.status(statusCode).json({ message: message, errors: data });
});

mongoose
	.connect(process.env.MONGOOSE_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})
	.then(() => {
		app.listen(PORT, () => {
			console.log(`[START] http://localhost:${PORT}`);
		});
	})
	.catch(err => {
		console.log(err);
	});
