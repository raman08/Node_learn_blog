let io;

module.exports = {
	init: (server, options) => {
		io = require('socket.io')(server, options);
		return io;
	},
	getIO: () => {
		if (!io) {
			throw new Error('[ERROR] Socket not initialized!!');
		}
		return io;
	},
};
