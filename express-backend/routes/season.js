require('dotenv').config();
const express = require('express');
const router = express.Router({mergeParams: true});
const dbf = require("../db/db");
const db = dbf.db;
const authOptional = require("../middleware/authOptional");
const { body, param, validationResult } = require('express-validator');
const episodeRoute = require("./episode");


//GET /api/shows/:showId/seasons/:seasonId
router.get('/:seasonId', authOptional, [
    param('showId').isInt({ min: 1 }).notEmpty().withMessage("ID serie non valido"),
    param('seasonId').isInt({ min: 1 }).notEmpty().withMessage("ID stagione non valido")
],async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {showId, seasonId} = req.params;

    if (req.user) {
        const user = req.user;
    }

    const sql = `SELECT * FROM Seasons WHERE SeasonID = ?`;

    

    try {
        const season = await dbf.getAsync(sql, [seasonId]);
        
        if (!season) {
            return res.status(404).json({message: "Stagione non trovata."});
        }

        res.json(season);
        
    } catch (err) {
        console.error("Errore query stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }


});

router.use('/:seasonId/episodes');

module.exports = router;