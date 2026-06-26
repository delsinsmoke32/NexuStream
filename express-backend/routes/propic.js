const express = require('express');
const router = express.Router({ mergeParams: true });
const propicController = require('../controllers/propicController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param } = require('express-validator');

 /**
 * @swagger
 * /api/propics/getAllBundled:
 *   get:
 *     summary: Recupera tutti i bundle di immagini profilo disponibili
 *     tags:
 *       - Propics
 *     responses:
 *       200:
 *         description: Lista dei gruppi di immagini profilo recuperata con successo
 *       500:
 *         description: Errore interno del server
 */

router.get('/getAllBundled', authOptional, [
], propicController.getPropics);

module.exports = router;