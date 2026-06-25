const propicModel = require('../models/propicModel');
const { validationResult } = require('express-validator');

/**
 * Recupera l'elenco di tutte le propic disponibili nel catalogo.
 * @param {Object} req - Oggetto della richiesta Express
 * @param {Object} res - Oggetto della risposta Express
 */

const getPropics = async (req, res) => {
    try {
        const propics = await propicModel.getAllPropics();
        
        // 1. Raggruppiamo le propic usando reduce
        // Output atteso: { "Bundle1": ["uri1.png", "uri2.png"], "Bundle2": ["uri3.png"] }
        const groupedMap = propics.reduce((acc, current) => {
            // Se il bundle non esiste ancora nell'oggetto, lo creiamo come array vuoto
            if (!acc[current.Bundle]) {
                acc[current.Bundle] = [];
            }
            // Inseriamo l'URI della propic nel bundle corrispondente
            acc[current.Bundle].push(current.PropicURI);
            return acc;
        }, {});

        // 2. Trasformiamo l'oggetto in un Array di oggetti per far felice Angular
        // Output finale: [ { bundle: 'Bundle1', images: ['uri1', 'uri2'] }, ... ]
        const result = Object.keys(groupedMap).map(bundleName => ({
            bundle: bundleName,
            images: groupedMap[bundleName]
        }));

        return res.json(result);

    } catch (error) {
        console.error("Errore durante il recupero delle propic:", error);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

module.exports = {
    getPropics
}