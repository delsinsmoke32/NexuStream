const express = require('express');
const router = express.Router({ mergeParams: true });
const discussionController = require('../controllers/discussionController');
const modController = require("../controllers/modController");
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const isMod = require("../middleware/isMod");
const { body, param } = require('express-validator');
const commentsRoute = require("./comments");


const commonParams = [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
];

/**
 * @swagger
 * /shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions:
 *  get:
 *    summary: Recupera la lista delle discussioni per un determinato episodio
 *    tags: [Discussions]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico della serie TV
 *      - in: path
 *        name: seasonId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico della stagione
 *      - in: path
 *        name: episodeId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico dell episodio
 *    responses:
 *      200:
 *        description: Lista delle discussioni recuperata con successo
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  DiscussionID:
 *                    type: integer
 *                  REF EpisodeID:
 *                    type: integer
 *                  OpenDate:
 *                    type: string
 *                  CloseDate:
 *                    type: string
 *                  ForceClosed:
 *                    type: integer
 *                  Type:
 *                    type: string
 *      400:
 *        description: Parametri nel path non validi (Validazione Express-Validator fallita)
 *      500:
 *        description: Errore interno del server
 */
router.get('/', authOptional, commonParams, discussionController.getDiscussions);

/**
 * @swagger
 * /shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}:
 *  get:
 *    summary: Recupera i dettagli di una specifica discussione tramite ID
 *    tags: [Discussions]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *      - in: path
 *        name: seasonId
 *        required: true
 *        schema:
 *          type: integer
 *      - in: path
 *        name: episodeId
 *        required: true
 *        schema:
 *          type: integer
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico della discussione specifica da cercare
 *    responses:
 *      200:
 *        description: Dettagli della discussione recuperati correttamente
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  DiscussionID:
 *                    type: integer
 *                  REF EpisodeID:
 *                    type: integer
 *                  OpenDate:
 *                    type: string
 *                  Type:
 *                    type: string
 *      400:
 *        description: ID discussione o parametri strutturali non validi
 *      404:
 *        description: Discussione non trovata
 *      500:
 *        description: Errore interno del server
 */
router.get('/:discussionId', authOptional, [
    ...commonParams,
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido")
    ], discussionController.getDiscussionById);


/**
 * @swagger
 * api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/add:
 *  post:
 *    summary: Crea una nuova discussione per un episodio
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - REF EpisodeID
 *              - CloseDate
 *              - Type
 *            properties:
 *              REF EpisodeID:
 *                type: integer
 *              closeDate:
 *                type: string
 *                example: "2027-01-01 00:00"
 *              type:
 *                type: string
 *                example: "standard"
 *    responses:
 *      201:
 *        description: Discussione creata con successo
 *      400:
 *        description: Dati di input non validi
 *      500:
 *        description: Errore interno del server
 */

router.post('/:discussionId/add', isMod, [
    ...commonParams,
    body('REF EpisodeID').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    body('closeDate').isString().notEmpty().withMessage("Data di chiusura richiesta"),
    body('type').isString().notEmpty().withMessage("Tipo discussione richiesto")
], modController.createDiscussion);

/**
 * @swagger
 * api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/modify:
 *  patch:
 *    summary: Modifica una discussione esistente (data chiusura o stato bloccato)
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              closeDate:
 *                type: string
 *              forceClosed:
 *                type: integer
 *                enum: [0, 1]
 *              Type:
 *                type: string
 *    responses:
 *      200:
 *        description: Discussione aggiornata con successo
 *      400:
 *        description: Input o ID non valido
 *      404:
 *        description: Discussione non trovata
 *      500:
 *        description: Errore interno del server
 */

router.patch('/:discussionId/modify', isMod, [
    ...commonParams,
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido"),
    body('closeDate').optional().isString().withMessage("La data deve essere una stringa"),
    body('forceClosed').optional().isInt({ min: 0, max: 1 }).withMessage("ForceClosed deve essere 0 o 1"),
    body('type').optional().isString().withMessage("Tipo deve essere una stringa")
], modController.updateDiscussion);

/**
 * @swagger
 * api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/delete:
 *  delete:
 *    summary: Elimina una discussione e i relativi commenti a cascata
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      200:
 *        description: Discussione eliminata con successo
 *      400:
 *        description: ID discussione non valido
 *      404:
 *        description: Discussione non trovata
 *      500:
 *        description: Errore interno del server
 */

router.delete('/:discussionId/delete', isMod, [
    ...commonParams,
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido")
], modController.deleteDiscussion);

// Iniezione del sotto-router dei commenti
router.use('/:discussionId/comments', commentsRoute);

module.exports = router;