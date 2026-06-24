const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');


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

router.post('/change-password', auth, [
    body('currentPassword').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri."),
    body('newPassword').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], userController.modifyPassword)

router.post('/change-propic', auth, [
    body('propicURI').isString().notEmpty().trim().withMessage("La nuova propic non deve essere vuota.")
], userController.modifyPropic)

module.exports = router;