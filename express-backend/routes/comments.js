require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require("../db/db")
const authOptional = require("../middleware/authOptional");
const auth = require("../middleware/auth");
const { query, body, param, validationResult } = require('express-validator');

//GET /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments
router.get('/', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    //la logica dell'authOptional è che non serve avere il jwt per vederli
     const {showId, seasonId, episodeId} = req.params;
    if (req.user) {
        const user = req.user.id;
    }

    /*const comment1 = {
        CommentID: 1001n,
        REF_UserID: 42n,
        REF_EpisodeID: 101n,
        DateCommented: '2024-05-10T14:30:00Z',
        REF_CommentID: 0n, // 0 indica che è un commento principale, non una risposta
        isHidden: false,
        Likes: 156n,
        isApproved: true
    };

    const comment2 = {
        CommentID: 1002n,
        REF_UserID: 88n,
        REF_EpisodeID: 101n,
        DateCommented: '2024-05-10T15:00:00Z',
        REF_CommentID: 1001n, // Questo commento è una risposta al commento 1001
        isHidden: false,
        Likes: 12n,
        isApproved: true
    };*/

    try {
        let sql = `SELECT
                c.*,
                u.Username, u.isAdmin, u.isMod
                FROM Comments c
                JOIN Users AS u ON c.REF_UserID = u.UserID
                WHERE c.REF_EpisodeID = ?`;

        const params = [episodeId];

        if (!user || !user.isMod) {
            //se l'utente non è mod vede solo i commenti non nascosti
            sql += ` AND c.isHidden = 0`;
        }

        sql += ` ORDER BY c.DateCommented DESC`;

        const comments = await db.allAsync(sql, params);

        //qualche check di sicurezza sui return values

        const sanitizedComments = comments.map(c => ({
            //spread operator, spalma tutte le proprietà di c qua dentro
            //e le converte come specificato
            ...c,
            CommentID: Number(c.CommentID),
            REF_UserID: Number(c.REF_UserID),
            REF_EpisodeID: Number(c.REF_EpisodeID),
            REF_CommentID: Number(c.REF_CommentID),
        }));

        res.json(sanitizedComments);

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({message: err.message});
        } else {
            res.status(400).json({message: "Errore sconosciuto."});
        }
    }
});


//PATCH /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments/:commentId/hide
router.patch('/:commentId/hide', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isHidden').isInt({min: 0, max: 1}).notEmpty().withMessage("isHidden deve essere un intero fra 0 e 1")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {showId, seasonId, episodeId, commentId} = req.params;
    const { isHidden } = req.body; //booleano

    if (!req.user.isMod == 0) {
        res.status(403).json({message: "Non hai i permessi per visualizzare questa pagina."});
    }

    try {
        const sql = `UPDATE Comments SET isHidden = ? WHERE CommentID = ?`;

        await db.allAsync(sql, [isHidden, commentId]);

        res.json({message: `Commento ${isHidden ? 'nascosto' : 'mostrato'} con successo.`});

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({message: err.message});
        } else {
            res.status(400).json({message: "Errore sconosciuto."});
        }
    }
});

//PATCH /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments/:commentId/approve
router.patch('/:commentId/approve', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isApproved').isInt({min: 0, max: 1}).notEmpty().withMessage("isHidden deve essere un intero fra 0 e 1")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {showId, seasonId, episodeId, commentId} = req.params;
    const { isApproved } = req.body;

    if (!req.user.isMod == 0){
        res.status(403).json({message: "Non hai i permessi per visualizzare questa pagina."});
    }

    try {
        const sql = `UPDATE Comments SET isApproved = ? WHERE CommentID = ?`;

        await db.allAsync(sql, [isApproved, commentId]);

        res.json({message: `Commento ${isApproved ? 'approvato' : 'non approvato'} con successo.`});

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({message: err.message});
        } else {
            res.status(400).json({message: "Errore sconosciuto."});
        }
    }
});

module.exports = router;