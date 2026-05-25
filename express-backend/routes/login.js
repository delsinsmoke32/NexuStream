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

module.exports = router;