require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbf = require("../db/db");
const db = dbf.db;

// router.get('/', (req, res) => {
//     res.send('Lista completa degli episodi...');
// });

//GET /api/episodes/id
router.get('/:id', async (req, res) => {
    const episodeId = req.params.id;

    const sql = `SELECT * FROM Episodes WHERE Episodes.EpisodeID = ?`;

    try {
        const episode = await dbf.getAsync(sql, [episodeId]);

        if (!episode) {
            return res.status(404).json({message: "Episodio non trovato."});
        }

        res.json(episode);

    } catch (err) {
        console.error("Errore query episodio: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;