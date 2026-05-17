require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbf = require("../db/db");
const db = dbf.db;
const authOptional = require("../middleware/authOptional");
const { body, param, validationResult } = require('express-validator');

// router.get('/', (req, res) => {
//     res.send('Lista completa degli episodi...');
// });

//GET /api/shows/:showId/seasons/:seasonId/episodes/:episodeId
router.get('/:episodeId', authOptional, [
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const episodeId = req.params.episodeId;

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