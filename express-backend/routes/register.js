require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
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