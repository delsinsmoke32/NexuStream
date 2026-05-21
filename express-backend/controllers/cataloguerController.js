const cataloguerModel = require('../models/cataloguerModel');
const { validationResult } = require('express-validator');

// ==========================================
// CONTROLLER RECUPERO
// ==========================================

/**
 * Recupera l'elenco di tutte le serie TV (Shows) disponibili nel catalogo.
 * Supporta un filtro di ricerca testuale opzionale tramite query parameter.
 * @param {Object} req - Oggetto della richiesta Express (può contenere req.query.search)
 * @param {Object} res - Oggetto della risposta Express
 */

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

/**
 * Recupera l'elenco di tutte le stagioni, filtrandole opzionalmente per lo Show di appartenenza.
 * @param {Object} req - Oggetto della richiesta Express (può contenere req.query.refShow)
 * @param {Object} res - Oggetto della risposta Express
 */

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

/**
 * Recupera l'elenco di tutte gli episodi, filtrandoli opzionalmente per la Stagione di appartenenza.
 * @param {Object} req - Oggetto della richiesta Express (può contenere req.query.refSeason)
 * @param {Object} res - Oggetto della risposta Express
 */

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
    
    // Ci aspettiamo che i testi arrivino divisi per lingua dal form del frontend
    const { title_it, title_en, title_jp, description_it, description_en, description_jp, dateStarted, dateEnded, hasEnded } = req.body;
    
    // Creiamo gli oggetti puliti da passare al Model (l'italiano è sempre obbligatorio come fallback)
    const titleObj = {
        it: title_it,
        ...(title_en && { en: title_en }),
        ...(title_jp && { jp: title_jp })
    };

    const descriptionObj = {
        it: description_it,
        ...(description_en && { en: description_en }),
        ...(description_jp && { jp: description_jp })
    };

    try {
        const result = await cataloguerModel.insertShow(titleObj, descriptionObj, dateStarted, dateEnded, hasEnded);
        return res.status(201).json({ message: "Serie creata con successo!", showId: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifyShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const showId = req.params.id;
    // 'lang' indica quale lingua si sta modificando (es. 'it', 'en', 'jp')
    const { title, description, dateEnded, hasEnded, lang } = req.body;

    let fields = [];
    let params = [];

    // Se si modifica il titolo, lo aggiorniamo chirurgicamente dentro il JSON usando la lingua passata
    if (title !== undefined) { 
        const targetLang = lang || 'it'; // Se non specificata, di default modifica l'italiano
        fields.push(`Title = json_set(Title, '$.${targetLang}', ?)`); 
        params.push(title); 
    }
    
    // Stessa cosa per la descrizione
    if (description !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Description = json_set(Description, '$.${targetLang}', ?)`); 
        params.push(description); 
    }
    
    // I campi non JSON rimangono esattamente come prima
    if (dateEnded !== undefined) { fields.push('DateEnded = ?'); params.push(dateEnded); }
    if (hasEnded !== undefined) { fields.push('hasEnded = ?'); params.push(hasEnded); }

    if (fields.length === 0) return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });

    try {
        const result = await cataloguerModel.updateShow(showId, fields, params);
        if (result.changes === 0) return res.status(404).json({ error: "La serie specificata non è stata trovata." });
        return res.json({ message: "Serie aggiornata con successo!" });
    } catch (err) {
        console.error(err);
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
    
    // Estraiamo i testi divisi per lingua dal body del form frontend
    const { title_it, title_en, title_jp, description_it, description_en, description_jp, dateStarted, dateEnded, hasEnded, refShow } = req.body;
    
    // Generiamo gli oggetti multilingua (con fallback obbligatorio su italiano 'it')
    const titleObj = {
        it: title_it,
        ...(title_en && { en: title_en }),
        ...(title_jp && { jp: title_jp })
    };

    const descriptionObj = {
        it: description_it,
        ...(description_en && { en: description_en }),
        ...(description_jp && { jp: description_jp })
    };

    try {
        const result = await cataloguerModel.insertSeason(titleObj, descriptionObj, dateStarted, dateEnded, hasEnded, refShow);
        return res.status(201).json({ message: "Stagione creata con successo!", seasonId: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifySeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const seasonId = req.params.id;
    // 'lang' indica quale chiave del JSON aggiornare (es. 'it', 'en', 'jp')
    const { title, description, dateEnded, hasEnded, refShow, lang } = req.body;

    let fields = [];
    let params = [];
    
    // Aggiornamento selettivo dei testi all'interno dell'oggetto JSON
    if (title !== undefined) { 
        const targetLang = lang || 'it'; // Default italiano se omesso
        fields.push(`Title = json_set(Title, '$.${targetLang}', ?)`); 
        params.push(title); 
    }
    if (description !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Description = json_set(Description, '$.${targetLang}', ?)`); 
        params.push(description); 
    }
    
    // I campi relazionali e temporali standard mantengono la sintassi nativa
    if (dateEnded !== undefined) { fields.push('DateEnded = ?'); params.push(dateEnded); }
    if (hasEnded !== undefined) { fields.push('hasEnded = ?'); params.push(hasEnded); }
    if (refShow !== undefined) { fields.push('REF_ShowID = ?'); params.push(refShow); }

    if (fields.length === 0) return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });

    try {
        const result = await cataloguerModel.updateSeason(seasonId, fields, params);
        if (result.changes === 0) return res.status(404).json({ error: "La stagione specificata non è stata trovata." });
        return res.json({ message: "Stagione aggiornata con successo!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removeSeason = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deleteSeason(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "La stagione specificata non è stata trouvata." });
        return res.json({ message: "Stagione cancellata con successo!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER EPISODI
// ==========================================

const addEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Estraiamo i dati, separando i testi delle varie lingue per Titolo e Descrizione
    const { 
        title_it, title_en, title_jp, 
        description_it, description_en, description_jp, 
        releaseDate, duration, refSeason, DubLanguages, SubLanguages 
    } = req.body;

    // Impacchettiamo gli oggetti JSON (con l'italiano sempre come base obbligatoria)
    const titleObj = {
        it: title_it,
        ...(title_en && { en: title_en }),
        ...(title_jp && { jp: title_jp })
    };

    const descriptionObj = {
        it: description_it,
        ...(description_en && { en: description_en }),
        ...(description_jp && { jp: description_jp })
    };

    try {
        const result = await cataloguerModel.insertEpisodeFull(
            titleObj, 
            descriptionObj, 
            releaseDate, 
            duration, 
            refSeason, 
            DubLanguages, 
            SubLanguages
        );
        return res.status(201).json({ message: "Episodio creato con successo!", episodeId: result.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const modifyEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const episodeId = req.params.id;
    // 'lang' specifica quale lingua sovrascrivere o aggiungere (es. 'en')
    const { title, description, refSeason, DubLanguages, SubLanguages, lang } = req.body;

    let fields = [];
    let fieldsParams = [];

    // Aggiornamento parziale e mirato del JSON tramite json_set
    if (title !== undefined) { 
        const targetLang = lang || 'it'; // Default italiano se omesso
        fields.push(`Title = json_set(Title, '$.${targetLang}', ?)`); 
        fieldsParams.push(title); 
    }
    if (description !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Description = json_set(Description, '$.${targetLang}', ?)`); 
        fieldsParams.push(description); 
    }
    
    // Campo relazionale standard
    if (refSeason !== undefined) { 
        fields.push('REF_SeasonID = ?'); 
        fieldsParams.push(refSeason); 
    }

    // Controllo di sicurezza: se non si aggiorna né la tabella principale né le relazioni audio/sub, blocca la richiesta
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
        console.error(err);
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
        console.error(err);
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
        await cataloguerModel.insertPropic(req.body.propicURI);
        return res.json({ message: "Propic aggiunta con successo!" });
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const removePropic = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await cataloguerModel.deletePropicByURI(req.body.propicURI);
        if (result.changes === 0) return res.status(404).json({ error: "L'URI propic specificato non esiste." });
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