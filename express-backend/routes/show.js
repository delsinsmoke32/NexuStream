require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbf = require("../db/db");
const db = dbf.db;
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

    if (req.user) {
        const user = req.user;
    }

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

router.use('/:showId/seasons');

module.exports = router;