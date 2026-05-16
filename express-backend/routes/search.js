require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db")
const authOptional = require("../middleware/authOptional");
const auth = require("../middleware/auth");

//GET /api/search
router.get('/', authOptional, async (req, res) => {
    const user = req.user;
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.status(400).json({error: "Inserire un termine di ricerca."});
    }

    const sql = `SELECT *,
       (CASE WHEN s.Title LIKE ? THEN 10 ELSE 0 END +
        CASE WHEN s.Description LIKE ? THEN 1 ELSE 0 END) AS RelevanceScore
        FROM Shows AS s WHERE s.Title LIKE ? OR s.Description LIKE ?
        ORDER BY RelevanceScore DESC, s.Title ASC`;

    const queryParam = `%${searchTerm}%`;

    try {
        const results = await dbf.allAsync(sql, [queryParam, queryParam, queryParam, queryParam]);
        res.json(results);
    } catch (err) {
        console.error("Errore query ricerca: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;