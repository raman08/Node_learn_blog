exports.getFeeds = (req, res, next) => {
	res.status(200).json({
		posts: [
			{
				title: "First Post",
				content: "This is my first Post :)",
				PublishDate: "21/09/2021",
			},
		],
	});
};

exports.postPost = (req, res, next) => {
	const { title, content } = req.body;

	res.status(201).json({
		message: "[SUCCESS] Post created sucessfully",
		post: { id: new Date().toISOString(), title: title, content: content },
	});
};
