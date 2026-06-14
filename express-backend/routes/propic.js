const express = require('express');
const router = express.Router({ mergeParams: true });
const propicController = require('../controllers/propicController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param } = require('express-validator');

// SWAGGER TODO

router.get('/getAllBundled', authOptional, [
], propicController.getBundledPropics);

// Sotto-rotta per agganciare le stagioni correlati

module.exports = router;