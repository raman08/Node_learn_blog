const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const feedRoutes = require("./routes/feed");

const app = express();

app.use(bodyParser.json());

const PORT = process.env.NODE_PORT;

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization"
	);

	next();
});

app.use("/feed", feedRoutes);

app.listen(PORT, () => {
	console.log(`[START] http://localhost:${PORT}`);
});
