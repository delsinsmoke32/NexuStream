const express = require('express');
const router = express.Router({ mergeParams: true });
const seasonController = require('../controllers/seasonController');
const authOptional = require("../middleware/authOptional");
const { param } = require('express-validator');
const episodeRoute = require("./episode");


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}:
 *  get:
 *    summary: Recupera i dettagli di una specifica stagione
 *    description: Restituisce i dettagli di una singola stagione con titolo e descrizione localizzati nella lingua dell'utente tramite il paradigma JSON.
 *    tags:
 *      - Seasons
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico dello show padre
 *      - in: path
 *        name: seasonId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico della stagione da recuperare
 *    responses:
 *      200:
 *        description: Dati della stagione recuperati con successo.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                SeasonID:
 *                  type: integer
 *                  example: 1
 *                REF ShowID:
 *                  type: integer
 *                  example: 1
 *                DateStarted:
 *                  type: string
 *                  format: date
 *                  example: "2023-01-01"
 *                hasEnded:
 *                  type: integer
 *                  example: 0
 *                DateEnded:
 *                  type: string
 *                  format: date
 *                  nullable: true
 *                  example: null
 *                SeasonNumber:
 *                  type: integer
 *                  example: 1
 *                Title:
 *                  type: string
 *                  description: Titolo della stagione estratto dal JSON in base alla lingua richiesta
 *                  example: "Stagione 1 - Genesi"
 *                Description:
 *                  type: string
 *                  description: Descrizione della stagione estratta dal JSON in base alla lingua richiesta
 *                  example: "La prima stagione introduce i personaggi."
 *      400:
 *        description: ID serie o ID stagione non validi o controlli formali falliti.
 *      404:
 *        description: Stagione non trovata.
 *      500:
 *        description: Errore interno del server.
 */


router.get('/:seasonId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido")
], seasonController.getSeasonDetails);

// Sotto-rotta nidificata per gli episodi di questa specifica stagione
router.use('/:seasonId/episodes', episodeRoute);

module.exports = router;