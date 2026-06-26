const seasonModel = require('../models/seasonModel');
const { validationResult } = require('express-validator');

const getSeasons = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    const { showId } = req.params;
    const user = req.user;
    const applang = user ? user.appLang : req.language;
    try {
        const seasons = await seasonModel.getSeasonsByShow(showId, applang);
        return res.json(seasons);
    } catch (err) {
        console.error("Errore query stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
}

const getSeasonDetails = async (req, res) => {
    // Controllo errori dei validatori di Express
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { seasonId } = req.params;
    const user = req.user;

    const applang = user ? user.appLang : req.language;

    try {
        // Chiamata al Model per estrarre la stagione
        const season = await seasonModel.getSeasonById(seasonId, applang);
        
        // Controllo esistenza
        if (!season) {
            return res.status(404).json({ message: "Stagione non trovata." });
        }

        return res.json(season);
        
    } catch (err) {
        console.error("Errore query stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const closeSeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { seasonId } = req.params;

    try {
        // Segna la stagione come conclusa (imposta hasEnded = 1)
        await seasonModel.markSeasonAsEnded(seasonId);

        // Crea in automatico le discussioni "post-season" per tutti gli episodi
        const result = await discussionModel.autoCreateSeasonDiscussions(seasonId);

        return res.json({ message: "Stagione chiusa con successo! Create le discussioni finali." });
    } catch (err) {
        console.error("Errore chiusura stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server durante la chiusura." });
    }
};

module.exports = {
    getSeasons,
    getSeasonDetails,
    closeSeason
};