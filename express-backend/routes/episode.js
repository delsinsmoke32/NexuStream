const express = require('express');
const router = express.Router({ mergeParams: true });
const episodeController = require('../controllers/episodeController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param } = require('express-validator');
const discussionsRoute = require("./discussion");

router.get('/', authOptional, [
    param('showId').isInt({min: 1}).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({min: 1}).notEmpty().withMessage("ID stagione non valido")
], episodeController.getEpisodes);

/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}:
 *  get:
 *    summary: Recupera i dettagli di un singolo episodio
 *    description: Restituisce le informazioni dell'episodio localizzato tramite la lingua dell'interfaccia, con i vettori delle lingue doppiate e dei sottotitoli già formattati in array.
 *    tags:
 *      - Episodes
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID della serie TV di appartenenza
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
 *        description: ID dell'episodio da recuperare
 *    responses:
 *      200:
 *        description: Dati dell'episodio estratti con successo.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                EpisodeID:
 *                  type: integer
 *                  example: 1
 *                ReleaseDate:
 *                  type: string
 *                  format: date
 *                  example: "2023-01-01"
 *                REF SeasonID:
 *                  type: integer
 *                  example: 1
 *                Duration:
 *                  type: integer
 *                  description: Durata dell'episodio in minuti
 *                  example: 45
 *                Likes:
 *                  type: integer
 *                  example: 120
 *                Streams:
 *                  type: integer
 *                  example: 1500
 *                ThumbnailURI:
 *                  type: string
 *                  example: "/static/thumbs/ep1.jpg"
 *                EpisodeNumber:
 *                  type: integer
 *                  example: 1
 *                Title:
 *                  type: string
 *                  description: Titolo dell'episodio estratto dal JSON in base alla lingua richiesta
 *                  example: "Il Silenzio"
 *                Description:
 *                  type: string
 *                  description: Trama dell'episodio estratta dal JSON in base alla lingua richiesta
 *                  example: "Il ritrovamento del primo indizio."
 *                DubLanguages:
 *                  type: array
 *                  items:
 *                    type: string
 *                  example: ["it", "en"]
 *                SubLanguages:
 *                  type: array
 *                  items:
 *                    type: string
 *                  example: ["it", "en", "jp"]
 *      400:
 *        description: Uno o più parametri ID non sono validi o i controlli formali sono falliti.
 *      404:
 *        description: Episodio non trovato.
 *      500:
 *        description: Errore interno del server.
 */
router.get('/:episodeId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
], episodeController.getEpisodeDetails);

/**
 * @swagger
 * /api/shows/{showId}/seasons/{seasonId}/episodes/{episodeId}/interact:
 *   post:
 *     summary: Registra o aggiorna lo stato di visione e interazione dell'utente (Progress, Like, Completato)
 *     tags:
 *       - Episodes
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
 *               - progress
 *               - isCompleted
 *               - isDropped
 *               - isLiked
 *             properties:
 *               progress:
 *                 type: integer
 *                 example: 450
 *               isCompleted:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *               isDropped:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *               isLiked:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Interazione memorizzata e contatore aggiornato.
 *       400:
 *         description: Dati non conformi o vincoli del DB violati.
 *       401:
 *         description: Token mancante o scaduto.
 *       500:
 *         description: Errore del server.
 */
router.post('/:episodeId/interact', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    body('progress').isInt({ min: 0 }).withMessage("Il progresso deve essere un intero positivo (secondi)"),
    body('isCompleted').isInt({ min: 0, max: 1 }).withMessage("isCompleted deve essere 0 o 1"),
    body('isDropped').isInt({ min: 0, max: 1 }).withMessage("isDropped deve essere 0 o 1"),
    body('isLiked').isInt({ min: 0, max: 1 }).withMessage("isLiked deve essere 0 o 1")
], episodeController.interactWithEpisode);

//===============================
//CAMBIA AUTH, METTILO PRIVATO
//===============================
router.get('/:episodeId/stream', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).withMessage("ID episodio non valido"),
], episodeController.stream);

// Iniezione del sotto-router delle discussioni
router.use('/:episodeId/discussions', discussionsRoute);

module.exports = router;