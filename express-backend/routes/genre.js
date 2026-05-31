const express = require('express');
const router = express.Router({ mergeParams: true });
const genreController = require('../controllers/genreController');
const authOptional = require("../middleware/authOptional");

router.get('/', authOptional, genreController.getGenres);

module.exports = router;