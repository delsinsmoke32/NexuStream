const express = require('express');
const router = express.Router();
const userController = require('../controllers/ffmpegController');

router.get('/process-video', userController.processVideo);

module.exports = router;