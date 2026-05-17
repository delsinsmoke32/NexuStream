require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const bcrypt = require('bcrypt');
const { body, param, validationResult } = require('express-validator');

router.post('/', [
    body('email').isEmail().notEmpty().withMessage("Email non valida"),
    body('password').isAlphanumeric().isLength({min : 8, max: 24}).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri."),
    body('conf_password').isAlphanumeric().isLength({min : 8, max: 24}).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri."),
    body('username').isAlphanumeric().isLength({min : 8, max: 24}).notEmpty().withMessage("L'username deve essere composto da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {email, password, username, conf_password} = req.body;

    if (password !== conf_password){
        return res.status(400).json({ message: "Le password non corrispondono." });
    }

    if (!password || String(password).length < 8) {
        return res.status(400).json({ message: "La password è troppo corta." });
    }

    try {
        const rounds = 10; //numero di round di hash
        const hashedPassword = await bcrypt.hash(password, rounds);

        const sql = `INSERT INTO Users (Username, Email, Password, isAdmin, isMod, isCataloguer) VALUES (?, ?, ?, 0, 0, 0)`;

        const result = await db.runAsync(sql, [username, email, hashedPassword]);

        console.log("Utente creato con ID: ", result.id);
        res.status(201).json({ message: "Registrazione Completata!", userId: result.id });

    } catch (error) {
        if (error instanceof Error){
            if (error.message.includes("UNIQUE")){
                return res.status(400).json({ message: "Email già in uso."});
            }
            res.status(500).json({ message: "Errore durante la registrazione." });
        }
         
    }

});


module.exports = router;