const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');


/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registra un nuovo utente nel sistema
 *     description: Crea un nuovo account utente crittografando la password e salvando le preferenze di lingua e immagine del profilo.
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
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 24
 *                 example: NuovoUtente99
 *               email:
 *                 type: string
 *                 format: email
 *                 example: registrazione@email.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 24
 *                 example: Segreta123!
 *               audioLanguageId:
 *                 type: string
 *                 example: "it"
 *               textLanguageId:
 *                 type: string
 *                 example: "it"
 *               appLanguageId:
 *                 type: string
 *                 example: "it"
 *               propicURI:
 *                 type: string
 *                 example: /static/avatars/avatar-000.png
 *     responses:
 *       201:
 *         description: Registrazione completata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registrazione Completata!
 *                 userId:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Richiesta non valida, password non corrispondenti o email/username già in uso.
 *       500:
 *         description: Errore interno del server durante la registrazione.
 */


// POST /api/register
router.post('/', [
    body('email').isEmail().notEmpty().withMessage("Email non valida"),
    body('password').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri."),
    body('username').isString().isLength({ min: 8, max: 24 }).notEmpty().withMessage("L'username deve essere composto da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri."),
    body("audioLanguageId").isString().isLength({ min: 2 , max: 2 }).withMessage("Id non valido"),
    body("textLanguageId").isString().isLength({ min: 2 , max: 2 }).withMessage("Id non valido"),
    body("appLanguageId").isString().isLength({ min: 2 , max: 2 }).withMessage("Id non valido"),
    body("propicURI").isString().notEmpty().trim().withMessage("URI propic non valido")
], authController.register);

module.exports = router;