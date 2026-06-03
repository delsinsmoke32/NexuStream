const genreModel = require('../models/genreModel');
const { validationResult } = require('express-validator');

const getGenres = async (req, res) => {
    try {
        const genres = await genreModel.getGenres();
        return res.json(genres);
    } catch (err) {
        console.error("Errore nel controller di moderazione:", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
}

module.exports = {
    getGenres
}