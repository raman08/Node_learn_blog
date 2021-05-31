const express = require('express');

const feedController = require('../controller/feed');

const router = express.Router();

router.get('/posts', feedController.getFeeds);
router.post('/posts', feedController.postPost);

module.exports = router;
