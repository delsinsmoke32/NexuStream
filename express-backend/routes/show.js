const express = require('express');
const router = express.Router({ mergeParams: true });
const showController = require('../controllers/showController');
const userController = require('../controllers/userController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param } = require('express-validator');
const seasonRoute = require("./season");

router.get('/favorites', auth, userController.getFavorites);


/**
 * @swagger
 * /api/shows/{showId}:
 *  get:
 *    summary: Recupera i dettagli di una singola serie TV
 *    description: Restituisce le informazioni dettagliate di uno show con titolo e descrizione estratti dal JSON in base alla lingua dell'utente.
 *    tags:
 *      - Shows
 *    parameters:
 *      - in: path
 *        name: showId
 *        required: true
 *        schema:
 *          type: integer
 *        description: ID numerico dello show da recuperare
 *    responses:
 *      200:
 *        description: Dati dello show recuperati con successo.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                ShowID:
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
 *                Favourited:
 *                  type: integer
 *                  example: 150
 *                ThumbnailURI:
 *                  type: string
 *                  example: "/static/thumbs/nebbia.jpg"
 *                BannerURI:
 *                  type: string
 *                  example: "/static/banners/nebbia-banner.jpg"
 *                Title:
 *                  type: string
 *                  description: Titolo dello show localizzato nella lingua dell'utente
 *                  example: "Nebbia Urbana"
 *                Description:
 *                  type: string
 *                  description: Descrizione dello show localizzata nella lingua dell'utente
 *                  example: "Un thriller psicologico ambientato a Milano."
 *      400:
 *        description: ID serie non valido o controlli formali falliti.
 *      404:
 *        description: Serie non trouvata.
 *      500:
 *        description: Errore interno del server.
 */

router.get('/:showId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido")
], showController.getShowDetails);


/**
 * @swagger
 * /api/shows/{showId}/interact:
 *   post:
 *     summary: Aggiunge o rimuove una serie dai preferiti (Like)
 *     tags:
 *       - Shows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numerico dello show
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLiked
 *             properties:
 *               isLiked:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Stato dei preferiti aggiornato con successo.
 *       400:
 *         description: Dati in ingresso non validi.
 *       401:
 *         description: Token non fornito o non valido.
 *       500:
 *         description: Errore interno del server.
 */


router.post('/:showId/interact', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    body('isLiked').isInt({ min: 0, max: 1 }).notEmpty().withMessage("Il like deve essere 0 o 1")
], showController.toggleShowLike);

/**
 * @swagger
 * /api/shows/{showId}/removeContinueWatching:
 *   post:
 *     summary: Rimuove l'intera serie dal "Continua a guardare" dell'utente
 *     tags: [Shows]
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Serie rimossa con successo dal continua a guardare" }
 *       400: { description: "ID serie non valido" }
 *       401: { description: "Non autorizzato" }
 */

router.post('/:showId/removeContinueWatching', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
], showController.dropShow);



// Sotto-rotta per agganciare le stagioni correlati
router.use('/:showId/seasons', seasonRoute);

module.exports = router;