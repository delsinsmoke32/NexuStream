const modModel = require('../models/modModel');
const { validationResult } = require('express-validator');

// GET - Già presente nel tuo codice, mantenuto per coerenza
const getDiscussions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { showClosed } = req.body;
    try {
        const discussions = await modModel.getDiscussions(showClosed);
        return res.json(discussions);
    } catch (err) {
        console.error("Errore recupero discussioni: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// POST - Creazione discussione
const createDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { REF_EpisodeID, closeDate, type } = req.body;
    // Generiamo automaticamente la data di apertura in formato ISO string o simile locale
    const openDate = new Date().toISOString().replace('T', ' ').substring(0, 16); 

    try {
        const result = await modModel.createDiscussion({ REF_EpisodeID, openDate, closeDate, type });
        return res.status(201).json({ message: "Discussione creata con successo.", discussionId: result.lastID });
    } catch (err) {
        console.error("Errore creazione discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// PATCH - Modifica parziale (ForceClosed, CloseDate)
const updateDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { discussionId } = req.params;
    const { closeDate, forceClosed, type } = req.body;

    try {
        const changes = await modModel.updateDiscussion(discussionId, { closeDate, forceClosed, type });
        if (changes === 0) {
            return res.status(404).json({ message: "Discussione non trovata o nessuna modifica effettuata." });
        }
        return res.json({ message: "Discussione aggiornata con successo." });
    } catch (err) {
        console.error("Errore aggiornamento discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// DELETE - Cancellazione a cascata
const deleteDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { discussionId } = req.params;

    try {
        const changes = await modModel.deleteDiscussion(discussionId);
        if (changes === 0) {
            return res.status(404).json({ message: "Discussione non trovata." });
        }
        return res.json({ message: "Discussione eliminata con successo." });
    } catch (err) {
        console.error("Errore eliminazione discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

module.exports = {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion
};