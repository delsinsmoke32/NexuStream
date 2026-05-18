require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbf = require("../db/db");
const db = dbf.db;
const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const { body, param, validationResult } = require('express-validator');
const seasonRoute = require("./season");


//GET /api/shows/:id
router.get('/:showId', authOptional, [
    param('showId').isInt({min: 1}).notEmpty().withMessage("ID serie non valido")
],async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const showId = req.params.showId;

   
    const user = req.user;


    const sql = `SELECT * FROM Shows WHERE ShowID = ?`;

    

    try {
        const show = await dbf.getAsync(sql, [showId]);
        
        if (!show) {
            return res.status(404).json({message: "Serie non trovata."});
        }

        res.json(show);

    } catch (err) {
        console.error("Errore query serie: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }


});


//POST /api/shows/:showId/interact
router.post('/:showId/interact', auth, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('userId').isInt({ min: 1 }).notEmpty().withMessage("ID utente non valido"),
    body('isLiked').isInt({min: 0, max: 1}).notEmpty().withMessage("Il like è 0 o 1")
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {showId} = req.params;
    const userId = req.user.id;
    const {isLiked} = req.body;

    const sqlLiked = `INSERT OR IGNORE INTO LINKs_User_Likes_Show(REF_UserID, REF_ShowID)
                      VALUES (?, ?)`;

    const sqlNotLiked = `DELETE FROM LINKs_User_Likes_Show WHERE REF_UserID = ? AND REF_ShowID = ?`;

    try {
        if (isLiked === 1) {
            //L'utente ha messo like
            const result = await dbf.runAsync(sqlLiked, [userId, showId]);

            //se esisteva già un record, non succede niente e questo non viene eseguito
            if (result.changes > 0) {
                await dbf.runAsync(`UPDATE Shows SET Favourited = Favourited + 1 WHERE ShowID = ?`, [showId]);
            }

            return res.status(200).json({ message: "Serie aggiunta ai preferiti!", isLiked: 1 });
        } else {
            const result = await dbf.runAsync(sqlNotLiked, [userId, showId]);

            //se non esisteva già un record, non succede niente e questo non viene eseguito
            if (result.changes > 0) {
                await dbf.runAsync(`UPDATE Shows SET Favourited = Favourited - 1 WHERE ShowID = ?`, [showId]);
            }

            return res.status(200).json({ message: "Serie rimossa dai preferiti!", isLiked: 0 });
        }
    } catch (err) {
        console.error("Errore gestione preferiti serie: ", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }

});

router.use('/:showId/seasons', seasonRoute);

module.exports = router;