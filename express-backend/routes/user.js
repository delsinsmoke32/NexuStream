require('dotenv').config();
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const db = require("../db/db");

router.get('/me', auth, async (req, res) => {
    try {
        const uid = req.user.id;

        const sql = `SELECT UserID, Username, Email, isAdmin, isMod, isCataloguer FROM Users WHERE id = ?`;
        const user = await db.getAsync(sql, [uid]);

        if (!user) {
            return res.status(400).json({message: "L'utente non esiste."});
        }
        res.json(user);

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: "Errore nel recupero del profilo." });
        }
    }
});

module.exports = router;