const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const isMod = require("../middleware/isMod");
const { body, param } = require('express-validator');

const commonParams = [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido")
];


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/comments:
 *   get:
 *     summary: Ottiene l'elenco dei commenti di un episodio
 *     tags:
 *       - Comments
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
 *     responses:
 *       200:
 *         description: Lista dei commenti caricata con successo.
 *   post:
 *     summary: Inserisce un nuovo commento o una risposta (Richiede Auth)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Episodio spettacolare!"
 *               parentCommentId:
 *                 type: integer
 *                 example: 45
 *     responses:
 *       201:
 *         description: Commento creato con successo.
 */


router.get('/', authOptional, commonParams, commentController.getEpisodeComments);

router.post('/', auth, [
    ...commonParams,
    body('parentCommentId').optional().isInt({ min: 1 }).withMessage("ID commento genitore non valido"),
    body('text').isString().trim().notEmpty().withMessage("Non si possono postare commenti vuoti")
], commentController.postComment);


/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/comments/{commentId}/interact:
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
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/comments/{commentId}/hide:
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
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/comments/{commentId}/approve:
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