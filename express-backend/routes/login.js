const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');


/**
 * @swagger
 * /api/login:
 *  post:
 *    summary: Effettua il login di un utente
 *    description: Verifica le credenziali dell'utente e restituisce un token JWT valido per 24 ore più i dati base del profilo.
 *    tags:
 *      - Autenticazione
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                example: utente@email.com
 *              password:
 *                type: string
 *                example: Password123!
 *    responses:
 *      200:
 *        description: Login effettuato con successo. Restituisce il token di sessione e i dettagli utente.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *                  description: Token JWT da includere nell'header Authorization per le rotte protette
 *                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                user:
 *                  type: object
 *                  properties:
 *                    UserID:
 *                      type: integer
 *                      example: 1
 *                    Username:
 *                      type: string
 *                      example: "MarioRossi"
 *                    Email:
 *                      type: string
 *                      example: "utente@email.com"
 *      400:
 *        description: Richiesta non valida, formato email errato o credenziali non corrette.
 *      500:
 *        description: Errore interno del server.
 */

// POST /api/login
router.post('/', [
    body('email').isEmail().notEmpty().withMessage("Email non valida"),
    body('password').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], authController.login);


/**
 * @swagger
 * /api/login/forgot-password:
 *   post:
 *     summary: Richiede il ripristino della password
 *     description: Verifica la presenza dell'email nel database e invia un link contenente un token temporaneo (valido 15 minuti) per reimpostare la password.
 *     tags:
 *       - Autenticazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: utente@nexustream.it
 *     responses:
 *       200:
 *         description: Richiesta elaborata correttamente. Per motivi di privacy, il messaggio è generico.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Se l'email è presente nel sistema, riceverai un link di reset.
 *       400:
 *         description: Input non valido (es. email malformata o vuota).
 *       500:
 *         description: Errore interno del server.
 */
router.post('/forgot-password', [
    body('email').isEmail().notEmpty().withMessage("Email non valida")
], authController.forgotPassword)


/**
 * @swagger
 * /api/login/reset-password:
 *   post:
 *     summary: Reimposta la password utente tramite token
 *     description: Convalida il token temporaneo ricevuto via email e, se ancora valido e non scaduto, aggiorna la password dell'utente sul database invalidando il token.
 *     tags:
 *       - Autenticazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f67890abcdef1234567890
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 24
 *                 example: NuovaPassword2026
 *     responses:
 *       200:
 *         description: Password aggiornata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password aggiornata con successo! Ora puoi accedere.
 *       400:
 *         description: Token invalido/scaduto o requisiti di complessità della password non rispettati.
 *       500:
 *         description: Errore interno del server.
 */
router.post('/reset-password', [
    body('token').isString().notEmpty().withMessage("Token non valido"),
    body('newPassword').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], authController.resetPassword)
module.exports = router;