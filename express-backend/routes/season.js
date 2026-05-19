const express = require('express');
const router = express.Router({ mergeParams: true });
const seasonController = require('../controllers/seasonController');
const authOptional = require("../middleware/authOptional");
const { param } = require('express-validator');
const episodeRoute = require("./episode");


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}:
 *   get:
 *     summary: Recupera i dettagli di una specifica stagione
 *     tags:
 *       - Seasons
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numerico dello show padre
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numerico della stagione da recuperare
 *     responses:
 *       200:
 *         description: Dati della stagione recuperati con successo.
 *       400:
 *         description: ID serie o ID stagione non validi.
 *       404:
 *         description: Stagione non trovata.
 *       500:
 *         description: Errore interno del server.
 */


router.get('/:seasonId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido")
], seasonController.getSeasonDetails);

// Sotto-rotta nidificata per gli episodi di questa specifica stagione
router.use('/:seasonId/episodes', episodeRoute);

module.exports = router;