const cataloguerModel = require('../models/cataloguerModel');
const { validationResult } = require('express-validator');

// ==========================================
// CONTROLLER RECUPERO
// ==========================================
const getShows = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const shows = await cataloguerModel.getAllShows(req.query.search);
        return res.json(shows);
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const getSeasons = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const seasons = await cataloguerModel.getAllSeasons(req.query.refShow);
        return res.json(seasons);
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const getEpisodes = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const episodes = await cataloguerModel.getAllEpisodes(req.query.refSeason);
        return res.json(episodes);
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER SERIE
// ==========================================
const addShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { title, description, dateStarted, dateEnded, hasEnded } = req.body;
    try {
        const result = await cataloguerModel.insertShow(title, description, dateStarted, dateEnded, hasEnded);
        return res.status(201).json({ message: "Serie creata con successo!", showId: result.id });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifyShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const showId = req.params.id;
    const { title, description, dateEnded, hasEnded } = req.body;

    let fields = [];
    let params = [];
    if (title !== undefined) { fields.push('Title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('Description = ?'); params.push(description); }
    if (dateEnded !== undefined) { fields.push('DateEnded = ?'); params.push(dateEnded); }
    if (hasEnded !== undefined) { fields.push('hasEnded = ?'); params.push(hasEnded); }

    if (fields.length === 0) return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });

    try {
        const result = await cataloguerModel.updateShow(showId, fields, params);
        if (result.changes === 0) return res.status(404).json({ error: "La serie specificata non è stata trovata." });
        return res.json({ message: "Serie aggiornata con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removeShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deleteShow(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "La serie specificata non è stata trovata." });
        return res.json({ message: "Serie cancellata con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER STAGIONI
// ==========================================
const addSeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { title, description, dateStarted, dateEnded, hasEnded, refShow } = req.body;
    try {
        const result = await cataloguerModel.insertSeason(title, description, dateStarted, dateEnded, hasEnded, refShow);
        return res.status(201).json({ message: "Stagione creata con successo!", seasonId: result.id });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifySeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const seasonId = req.params.id;
    const { title, description, dateEnded, hasEnded, refShow } = req.body;

    let fields = [];
    let params = [];
    if (title !== undefined) { fields.push('Title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('Description = ?'); params.push(description); }
    if (dateEnded !== undefined) { fields.push('DateEnded = ?'); params.push(dateEnded); }
    if (hasEnded !== undefined) { fields.push('hasEnded = ?'); params.push(hasEnded); }
    if (refShow !== undefined) { fields.push('REF_ShowID = ?'); params.push(refShow); }

    if (fields.length === 0) return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });

    try {
        const result = await cataloguerModel.updateSeason(seasonId, fields, params);
        if (result.changes === 0) return res.status(404).json({ error: "La stagione specificata non è stata trovata." });
        return res.json({ message: "Stagione aggiornata con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removeSeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deleteSeason(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "La stagione specificata non è stata trovata." });
        return res.json({ message: "Stagione cancellata con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER EPISODI
// ==========================================
const addEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, releaseDate, duration, refSeason, DubLanguages, SubLanguages } = req.body;
    try {
        const result = await cataloguerModel.insertEpisodeFull(title, description, releaseDate, duration, refSeason, DubLanguages, SubLanguages);
        return res.status(201).json({ message: "Episodio creato con successo!", episodeId: result.id });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifyEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const episodeId = req.params.id;
    const { title, description, refSeason, DubLanguages, SubLanguages } = req.body;

    let fields = [];
    let fieldsParams = [];
    if (title !== undefined) { fields.push('Title = ?'); fieldsParams.push(title); }
    if (description !== undefined) { fields.push('Description = ?'); fieldsParams.push(description); }
    if (refSeason !== undefined) { fields.push('REF_SeasonID = ?'); fieldsParams.push(refSeason); }

    if (fields.length === 0 && !DubLanguages && !SubLanguages) {
        return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });
    }

    try {
        const result = await cataloguerModel.updateEpisodeFull(episodeId, fields, fieldsParams, DubLanguages, SubLanguages);
        if (fields.length > 0 && result.changes === 0) {
            return res.status(404).json({ error: "L'episodio specificato non è stato trovato." });
        }
        return res.json({ message: "Episodio aggiornato con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removeEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deleteEpisode(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "L'episodio specificato non è stato trovato." });
        return res.json({ message: "Episodio cancellato con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER PROPIC
// ==========================================
const addPropic = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        await cataloguerModel.insertPropic(req.body.propicPath);
        return res.json({ message: "Propic aggiunta con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removePropic = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deletePropicByPath(req.body.propicPath);
        if (result.changes === 0) return res.status(404).json({ error: "Il path propic specificato non esiste." });
        return res.json({ message: "Propic cancellata con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

module.exports = {
    getShows, getSeasons, getEpisodes,
    addShow, modifyShow, removeShow,
    addSeason, modifySeason, removeSeason,
    addEpisode, modifyEpisode, removeEpisode,
    addPropic, removePropic
};