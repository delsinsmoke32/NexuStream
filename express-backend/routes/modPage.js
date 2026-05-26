const express = require('express');
const router = express.Router({ mergeParams: true });
const modController = require('../controllers/modController');
const isMod = require("../middleware/isMod");
const { query, body, param } = require('express-validator');

router.use(isMod);

/**
 * @swagger
 * api/mod/discussions:
 *  get:
 *    summary: Recupera la lista delle discussioni con filtro opzionale
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: query
 *        name: showClosed
 *        required: false
 *        schema:
 *          type: integer
 *          enum: [0, 1]
 *        description: Se impostato a 1 mostra anche le discussioni chiuse o scadute
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
 *        description: Parametro showClosed non valido
 *      401:
 *        description: Token mancante o non valido
 *      403:
 *        description: Utente non autorizzato (Non è un moderatore)
 *      500:
 *        description: Errore interno del server
 */

router.get('/discussions', [
    body('showClosed').optional().isInt({ min: 0, max: 1 }).withMessage("Lo show closed deve essere 0 o 1")
], modController.getDiscussions);

/**
 * @swagger
 * api/mod/discussions:
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
router.post('/discussions', [
    body('REF EpisodeID').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    body('closeDate').isString().notEmpty().withMessage("Data di chiusura richiesta"),
    body('type').isString().notEmpty().withMessage("Tipo discussione richiesto")
], modController.createDiscussion);

/**
 * @swagger
 * api/mod/discussions/{discussionId}:
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
router.patch('/discussions/:discussionId', [
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido"),
    body('closeDate').optional().isString().withMessage("La data deve essere una stringa"),
    body('forceClosed').optional().isInt({ min: 0, max: 1 }).withMessage("ForceClosed deve essere 0 o 1"),
    body('type').optional().isString().withMessage("Tipo deve essere una stringa")
], modController.updateDiscussion);

/**
 * @swagger
 * api/mod/discussions/{discussionId}:
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
router.delete('/discussions/:discussionId', [
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido")
], modController.deleteDiscussion);

module.exports = router;