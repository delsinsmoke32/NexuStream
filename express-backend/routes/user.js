const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');


/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Recupera il profilo dell'utente corrente loggato
 *     description: Utilizza il token JWT fornito nell'header Authorization per identificare l'utente e restituire i suoi dettagli e ruoli.
 *     tags:
 *       - Utenti
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dati del profilo recuperati con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 UserID:
 *                   type: integer
 *                   example: 12
 *                 Username:
 *                   type: string
 *                   example: StreamerGamer
 *                 Email:
 *                   type: string
 *                   format: email
 *                   example: utente@email.com
 *                 isAdmin:
 *                   type: integer
 *                   example: 0
 *                 isMod:
 *                   type: integer
 *                   example: 0
 *                 isCataloguer:
 *                   type: integer
 *                   example: 0
 *       401:
 *         description: Token mancante o non valido.
 *       404:
 *         description: Utente non trovato nel database.
 *       500:
 *         description: Errore interno del server durante il recupero del profilo.
 */


router.get('/me', auth, userController.getMyProfile);

module.exports = router;