require('dotenv').config();
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');

//POST /api/login
router.post('/', [
    body('email').isEmail().notEmpty().withMessage("Email non valida"),
    body('password').isAlphanumeric().isLength({min : 8, max: 24}).notEmpty().withMessage("La password deve essere composta da lettere, numeri o caratteri speciali, con una lunghezza compresa fra 8 e 24 caratteri.")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {email, password} = req.body;
    try {
        const sql = `SELECT * FROM Users WHERE Email = ?`;
        const usr = await db.getAsync(sql, [email]);

        if (!usr) {
            return res.status(400).json({ message: "L'utente non esiste."});
        }

        const isMatch = await bcrypt.compare(password, usr.Password);
        if (!isMatch){
            return res.status(400).json({ message: "Email o password errati." });
        }

        const token = jwt.sign(
            {id: usr.UserID, username: usr.Username, isAdmin: usr.isAdmin, isMod: usr.isMod, isCat: usr.isCataloguer},
            process.env.JWT_SECRET,
            { expiresIn: '24h' } //scadenza del token
        );

        delete usr.Password;
        res.json({
            message: "Welcome back, " + usr.Username,
            usr,
            token,
        });
        
    } catch (error) {
        if (error instanceof Error){
            console.error("Errore DB: ", error.message);
            res.status(500).json({ error: error.message });
        } else {
            console.error("Errore sconosciuto, ma chi facisti?");
        }
    }


});


module.exports = router;