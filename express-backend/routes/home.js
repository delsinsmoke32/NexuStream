const express = require('express');
const router = express.Router({ mergeParams: true });
const showController = require('../controllers/showController');
const authOptional = require("../middleware/authOptional");

/**
 * @swagger
 * /api/home:
 *   get:
 *     summary: Recupera i dati della Homepage
 *     description: Restituisce i contenuti per la home. Se la richiesta include un token JWT valido, include anche la lista "Continua a guardare" personalizzata per l'utente.
 *     tags:
 *       - Homepage
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dati della homepage recuperati con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topLiked:
 *                   type: array
 *                   items:
 *                     type: object
 *                 topViewed:
 *                   type: array
 *                   items:
 *                     type: object
 *                 recentDisc:
 *                   type: array
 *                   items:
 *                     type: object
 *                 continueWatching:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Errore interno del server durante il caricamento della home.
 */

router.get('/', authOptional, showController.getHomeData);

module.exports = router;