const propicModel = require('../models/propicModel');
const { validationResult } = require('express-validator');

/**
 * Recupera l'elenco di tutte le propic disponibili nel catalogo.
 * @param {Object} req - Oggetto della richiesta Express
 * @param {Object} res - Oggetto della risposta Express
 */

const getBundledPropics = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const propics = await propicModel.getAllPropics();
        // Raggruppa i dati nel formato richiesto
        const formattedData = propics.reduce((acc, row) => {
            // Se il bundle non esiste ancora nell'array, crealo
            if (!acc[row.Bundle]) {
                acc[row.Bundle] = [];
            }
            // Aggiungi l'URI dell'avatar al rispettivo bundle
            acc[row.Bundle].push(row.PropicURI);
            return acc;
        }, {});
        return res.json(formattedData);
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

module.exports = {
    getBundledPropics
}