require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbf = require("../db/db");
const db = dbf.db;
const authOptional = require("../middleware/authOptional");
const { body, param, validationResult } = require('express-validator');


//GET /api/shows/:showId/seasons/:seasonId
router.get('/:seasonId', authOptional, [
    param('seasonId').isInt({min: 1}).notEmpty().withMessage("ID stagione non valido")
],async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const seasonId = req.params.seasonId;

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


})