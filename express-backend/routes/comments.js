require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db");
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const isMod = require("../middleware/isMod");
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

    const user = req.user;

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

        const comments = await dbf.allAsync(sql, params);

        /*//qualche check per evitare rotture con sqlite, ma a quanto pare
        non è strettamente necessario so here's hoping

        const sanitizedComments = comments.map(c => ({
            //spread operator, spalma tutte le proprietà di c qua dentro
            //e le converte come specificato
            ...c,
            CommentID: Number(c.CommentID),
            REF_UserID: Number(c.REF_UserID),
            REF_EpisodeID: Number(c.REF_EpisodeID),
            REF_CommentID: Number(c.REF_CommentID),
        }));*/

        res.json(comments);

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({message: err.message});
        } else {
            res.status(400).json({message: "Errore sconosciuto."});
        }
    }
});


//POST /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments
router.post('/', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    body('parentCommentId').optional().isInt({ min: 1 }).notEmpty().withMessage("ID commento genitore non valido"),
    body('text').isString().trim().notEmpty().withMessage("Non si possono postare commenti vuoti"),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    
    const {showId, seasonId, episodeId} = req.params;
    const {text, parentCommentId} = req.body;
    const userId = req.user.id;
    //il timestamp dovrebbe essere preso in automatico dal db
    //const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let sql = `INSERT INTO Comments (REF_CommentID, REF_UserID, REF_EpisodeID, CommentText, isHidden, Likes, isApproved)
               VALUES (?, ?, ?, ?, 0, 0, 0)`;

    const params = [parentCommentId || null, userId, episodeId, text];

    try {
        const result = await dbf.runAsync(sql, params);
        return res.status(201).json({
            message: "Commento postato con successo!",
            commentId: result.id});
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            console.error(err);
            return res.status(400).json({ message: "Impossibile postare il commento: riferimenti non validi." });
        }
        return res.status(500).json({ message: "Errore interno del server." });
    }
});


//POST /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments/:commentId/interact
router.post('/:commentId/interact', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido"),
    param('episodeId').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isLiked').optional().isInt({min: 0, max: 1}).notEmpty().withMessage("Il like è un booleano"),
    body('isReported').optional().isInt({min: 0, max: 1}).notEmpty().withMessage("Il report è un booleano")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    
    const {showId, seasonId, episodeId, commentId} = req.params;
    const {isLiked, isReported} = req.body;
    const userId = req.user.id;

    let sql = `INSERT INTO LINKs_User_Interacts_Comment (REF_CommentID, REF_UserID, isLiked, isReported)
               VALUES (?, ?, ?, ?) ON CONFLICT(REF_CommentID, REF_UserID) DO UPDATE SET
               isLiked = excluded.isLiked,
               isReported = excluded.isReported`;

    const checkSQL = `SELECT isLiked, isReported FROM LINKs_User_Interacts_Comment WHERE REF_UserID = ? AND REF_CommentID = ?`;
    const params = [commentId, userId, isLiked, isReported];

    try {
        const oldInteraction = await dbf.getAsync(checkSQL, [userId, commentId]);

        const oldLiked = oldInteraction ? oldInteraction.isLiked : 0;
        const oldReported = oldInteraction ? oldInteraction.isReported : 0;

        const newLiked = isLiked !== undefined ? isLiked : oldLiked;
        const newReported = isReported !== undefined ? isReported : oldReported;

        // Se newLiked è 1 e oldLiked era 0 -> delta = 1  (Nuovo Like)
        // Se newLiked è 0 e oldLiked era 1 -> delta = -1 (Unlike)
        // Se sono uguali -> delta = 0 (Nessuna modifica al click o solo cambio report)
        const likeDelta = newLiked - oldLiked;

        const result = await dbf.runAsync(sql, params);
        return res.status(201).json({
            message: "Interazione registrata con successo!",
            likeStatus: newLiked,
            likeDelta: likeDelta});
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: "Impossibile postare il commento: riferimenti non validi." });
        }
        return res.status(500).json({ message: "Errore interno del server." });
    }
});


//PATCH /api/shows/:showId/seasons/:seasonId/episodes/:episodeId/comments/:commentId/hide
router.patch('/:commentId/hide', isMod, [
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
router.patch('/:commentId/approve', isMod, [
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