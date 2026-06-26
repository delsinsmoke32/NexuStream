const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const auth = require("../middleware/auth");
//const authOptional = require("../middleware/authOptional");
const isMod = require("../middleware/isMod");
const { body, param } = require('express-validator');

const commonParams = [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    param('discussionId').isInt( { min: 1 }).notEmpty().withMessage("ID discussione non valido")
];


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/comments:
 *  get:
 *    summary: Ottiene l'elenco dei commenti di una discussione
 *    description: Restituisce la lista di tutti i commenti lasciati dagli utenti per la specifica discussione, comprensivi di informazioni sull'autore e l'eventuale struttura ad albero (risposte).
 *    tags:
 *      - Comments
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID dello show di appartenenza
 *      - in: path
 *        name: seasonId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID della stagione di appartenenza
 *      - in: path
 *        name: episodeId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID dell'episodio di appartenenza
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID della discussione da cui prelevare i commenti 
 *    responses:
 *      200:
 *        description: Lista dei commenti caricata con successo.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *            items:
 *              type: object
 *              properties:
 *                CommentID:
 *                  type: integer
 *                  example: 102
 *                Text:
 *                  type: string
 *                  example: "Episodio spettacolare! La trama si fa interessante."
 *                PublishDate:
 *                  type: string
 *                  format: date-time
 *                  example: "2026-05-21T16:45:00Z"
 *                REF ParentCommentID:
 *                  type: integer
 *                  nullable: true
 *                  description: ID del commento padre, valorizzato solo se si tratta di una risposta di secondo livello
 *                  example: null
 *                User:
 *                  type: object
 *                  properties:
 *                    UserID:
 *                      type: integer
 *                      example: 5
 *                    Username:
 *                      type: string
 *                      example: "Zoro99"
 *                    PropicURI:
 *                      type: string
 *                      example: "/static/avatars/avatar-002.png"
 *      400:
 *        description: Uno o più ID nel path non sono validi o i controlli formali sono falliti.
 *      404:
 *        description: Discussione non trovata.
 *      500:
 *        description: Errore del server durante il caricamento dei commenti.
 *  post:
 *    summary: Inserisce un nuovo commento o una risposta (Richiede Auth)
 *    description: Permette a un utente autenticato di pubblicare un commento principale o di rispondere a un commento già esistente indicando il parentCommentId.
 *    tags:
 *      - Comments
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
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - text
 *            properties:
 *              text:
 *                type: string
 *                example: "Sono d'accordo con te, bellissima scena!"
 *              parentCommentId:
 *                type: integer
 *                description: ID del commento a cui si sta rispondendo. Omettere se si tratta di un commento principale.
 *                example: 102
 *    responses:
 *      201:
 *        description: Commento o risposta creati con successo.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "Commento inserito con successo!"
 *                commentId:
 *                  type: integer
 *                  example: 103
 *      400:
 *        description: Testo mancante, ID non validi o controlli di validazione falliti.
 *      401:
 *        description: Non autenticato, token mancante o scaduto.
 *      404:
 *        description: Episodio o commento padre non trovati.
 *      500:
 *        description: Errore del server durante il salvataggio del commento.
 */


router.get('/', auth, commonParams, commentController.getDiscussionComments);

router.post('/', auth, [
    ...commonParams,
    body('parentCommentId').optional().isInt({ min: 1 }).withMessage("ID commento genitore non valido"),
    body('text').isString().trim().notEmpty().withMessage("Non si possono postare commenti vuoti")
], commentController.postComment);


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/comments/{commentId}/interact:
 *   post:
 *     summary: Gestisce i Like e i Report su un commento (Richiede Auth)
 *     tags:
 *       - Comments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: discussionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isLiked:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *               isReported:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       201:
 *         description: Interazione elaborata con successo.
 */


router.post('/:commentId/interact', auth, [
    ...commonParams,
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isLiked').optional().isInt({ min: 0, max: 1 }).withMessage("Il like deve essere 0 o 1"),
    body('isReported').optional().isInt({ min: 0, max: 1 }).withMessage("Il report deve essere 0 o 1")
], commentController.interactWithComment);


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/comments/{commentId}/hide:
 *   patch:
 *     summary: Nasconde o mostra un commento (Solo Moderatori)
 *     tags:
 *       - Comments Moderation
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: discussionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isHidden
 *             properties:
 *               isHidden:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Visibilità aggiornata con successo.
 */


router.patch('/:commentId/hide', isMod, [
    ...commonParams,
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isHidden').isInt({ min: 0, max: 1 }).notEmpty().withMessage("isHidden deve essere un intero fra 0 e 1")
], commentController.hideComment);


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/discussions/{discussionId}/comments/{commentId}/approve:
 *   patch:
 *     summary: Approva o disapprova un commento (Solo Moderatori)
 *     tags:
 *       - Comments Moderation
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: discussionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Stato approvazione aggiornato con successo.
 */


router.patch('/:commentId/approve', isMod, [
    ...commonParams,
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isApproved').isInt({ min: 0, max: 1 }).notEmpty().withMessage("isApproved deve essere un intero fra 0 e 1")
], commentController.approveComment);

module.exports = router;