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

    const sql = `SELECT e.*,
            (SELECT GROUP_CONCAT(Language) FROM EpisodeLanguage AS el WHERE e.EpisodeID = el.REF_EpisodeID) AS DubLanguages,
            (SELECT GROUP_CONCAT(Language) FROM EpisodeSub AS es WHERE e.EpisodeID = es.REF_EpisodeID) AS SubLanguages
            FROM Episodes AS e WHERE e.EpisodeID = ?`;

    try {
        const episode = await dbf.getAsync(sql, [episodeId]);

        if (!episode) {
            return res.status(404).json({message: "Episodio non trovato."});
        }


        //trasformo dub e sub in array di stringhe per ionic
        const response = {
            ...episode,
            DubLanguages: episode.DubLanguages ? episode.DubLanguages.split(',') : [],
            SubLanguages: episode.SubLanguages ? episode.SubLanguages.split(',') : []
        };

        res.json(episode);

    } catch (err) {
        console.error("Errore query episodio: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;