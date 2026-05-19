const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');


/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Effettua il login di un utente
 *     description: Verifica le credenziali dell'utente e restituisce un token JWT valido per 24 ore.
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
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: utente@email.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login effettuato con successo.
 *       400:
 *         description: Richiesta non valida, email o password errati.
 *       500:
 *         description: Errore interno del server.
 */

// POST /api/login
router.post('/', [
    body('email').isEmail().notEmpty().withMessage("Email non valida"),
    body('password').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], authController.login);

module.exports = router;