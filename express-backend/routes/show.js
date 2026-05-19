const express = require('express');
const router = express.Router({ mergeParams: true });
const showController = require('../controllers/showController');
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param } = require('express-validator');
const seasonRoute = require("./season");


/**
 * @swagger
 * /api/shows/{showId}:
 *   get:
 *     summary: Recupera i dettagli di una singola serie TV
 *     tags:
 *       - Shows
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numerico dello show
 *     responses:
 *       200:
 *         description: Dati dello show recuperati con successo.
 *       400:
 *         description: ID serie non valido.
 *       404:
 *         description: Serie non trovata.
 *       500:
 *         description: Errore interno del server.
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

// Sotto-rotta per agganciare le stagioni correlati
router.use('/:showId/seasons', seasonRoute);

module.exports = router;