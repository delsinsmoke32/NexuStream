require('dotenv').config();
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
    const {email, password} = req.body;
    try {
        const sql = `SELECT * FROM Users WHERE Email = ?`;
        const usr = await db.getAsync(sql, [email]);

        if (!usr) {
            return res.status(400).json({ message: "L'utente non esiste."});
        }

        const isMatch = await bcrypt.compare(password, usr.password);
        if (!isMatch){
            return res.status(400).json({ message: "Email o password errati." });
        }

        const token = jwt.sign(
            {id: usr.id, username: usr.username},
            process.env.JWT_TOKEN,
            { expiresIn: '24h' } //scadenza del token
        );

        delete usr.password;
        res.json({
            message: "Welcome back, " + usr.username,
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