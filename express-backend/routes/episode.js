require('dotenv').config();
const express = require('express');
const router = express.Router({mergeParams: true});
const dbf = require("../db/db");
const db = dbf.db;
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param, validationResult, check } = require('express-validator');
const commentsRoute = require("./comments");

// router.get('/', (req, res) => {
//     res.send('Lista completa degli episodi...');
// });

//GET /api/shows/:showId/seasons/:seasonId/episodes/:episodeId
router.get('/:episodeId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const {showId, seasonId, episodeId} = req.params;

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


// POST /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/interact
router.post('/:episodeId/interact', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    body('progress').isInt({ min: 0 }).withMessage("Il progresso deve essere un intero positivo (secondi)"),
    body('isCompleted').isInt({ min: 0, max: 1 }).withMessage("isCompleted deve essere 0 o 1"),
    body('isDropped').isInt({ min: 0, max: 1 }).withMessage("isDropped deve essere 0 o 1"),
    body('isLiked').isInt({ min: 0, max: 1 }).withMessage("isLiked deve essere 0 o 1")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {showId, seasonId, episodeId} = req.params;
    const {progress, isCompleted, isDropped, isLiked} = req.body;
    const userId = req.user.id;

    const sql = `INSERT INTO LINKs_User_Interacts_Episode
                    (REF_UserID, REF_EpisodeID, LastWatchedDate, Progress, isCompleted, isDropped, isLiked)
                VALUES
                    (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
                ON CONFLICT(REF_UserID, REF_EpisodeID) DO UPDATE SET
                    LastWatchedDate = CURRENT_TIMESTAMP,
                    Progress = excluded.Progress,   -- aggiorna i secondi riprodotti
                    isCompleted = excluded.isCompleted,   -- dice se l'ep è completato
                    isDropped = excluded.isDropped,   -- toggle dell'utente
                    isLiked = excluded.isLiked  -- like, gestito col delta`;

    const checkSQL = 'SELECT isLiked FROM LINKs_User_Interacts_Episode WHERE REF_EpisodeID = ? AND REF_UserID = ?';

    const params = [userId, episodeId, progress, isCompleted, isDropped, isLiked];

    try {
        const oldInteraction = await dbf.getAsync(checkSQL, [episodeId, userId]);

        const oldLiked = oldInteraction ? oldInteraction.isLiked : 0;
        
        // Calcoliamo il delta (1, -1, o 0)
        const likeDelta = isLiked - oldLiked;

        const result = await dbf.runAsync(sql, params);

        if (likeDelta !== 0) {
            const updateEpisodeLikesSql = `UPDATE Episodes SET Likes = Likes + ? WHERE EpisodeID = ?`;
            await dbf.runAsync(updateEpisodeLikesSql, [likeDelta, episodeId]);
        }
    
        return res.status(200).json({ 
            message: "Interazione memorizzata con successo!",
            likeDelta: likeDelta
        });

    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: "Impossibile interagire con l'episodio: riferimenti non validi." });
        }
        return res.status(500).json({ message: "Errore interno del server." });
    }

                
});

router.use('/:episodeId/comments', commentsRoute);

module.exports = router;