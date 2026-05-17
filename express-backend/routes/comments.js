require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require("../db/db")
const authOptional = require("../middleware/authOptional");
const auth = require("../middleware/auth");
const { query, body, param, validationResult } = require('express-validator');

//GET /api/episodes/:id/comments
router.get('/', authOptional, [

], async (req, res) => {
    //la logica dell'authOptional è che non serve avere il jwt per vederli
    const episodeId = req.params.id;
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


//PATCH /api/episodes/:id/comments/:commentId/hide
router.patch('/:commentId/hide', auth, async (req, res) => {
    if (!req.user.isMod == 0) {
        res.status(403).json({message: "Non hai i permessi per visualizzare questa pagina."});
    }

    const { commentId } = req.params;
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

//PATCH /api/episodes/:id/comments/:commentId/approve
router.patch('/:commentId/approve', auth, async (req, res) => {
    if (!req.user.isMod == 0){
        res.status(403).json({message: "Non hai i permessi per visualizzare questa pagina."});
    }

    const { commentId } = req.params;
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