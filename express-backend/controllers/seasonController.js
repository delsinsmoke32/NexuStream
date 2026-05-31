const seasonModel = require('../models/seasonModel');
const { validationResult } = require('express-validator');

const getSeasonDetails = async (req, res) => {
    // Controllo errori dei validatori di Express
    const errors = validationResult(req);
    if (!errors.isEmpty()){
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

module.exports = {
    getSeasonDetails
};