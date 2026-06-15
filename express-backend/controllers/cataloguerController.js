const cataloguerModel = require('../models/cataloguerModel');
const showModel = require('../models/showModel');
const episodeModel = require('../models/episodeModel');
const { validationResult, check } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const multerConfig = require("../middleware/multerConfig");

// ==========================================
// CONTROLLER RECUPERO
// ==========================================

/**
 * Recupera l'elenco di tutte le serie TV (Shows) disponibili nel catalogo.
 * Supporta un filtro di ricerca testuale opzionale e paginazione tramite query parameter.
 * @param {Object} req - Oggetto della richiesta Express (può contenere req.query.search, req.query.page, req.query.limit)
 * @param {Object} res - Oggetto della risposta Express
 */
const getShows = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    // Calcolo della paginazione per fermare l'infinite scroll del frontend
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    try {
        const shows = await cataloguerModel.getAllShows(req.query.search, limit, offset);
        return res.json(shows);
    } catch (err) {
        console.error("Errore getShows:", err);
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
        console.error("Errore getSeasons:", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

/**
 * Recupera l'elenco di tutti gli episodi, filtrandoli opzionalmente per la Stagione di appartenenza.
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
        console.error("Errore getEpisodes:", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};


// ==========================================
// CONTROLLER SERIE
// ==========================================
// ==========================================
// CREAZIONE SERIE
// ==========================================
const addShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { title_it, title_en, title_jp, description_it, description_en, description_jp, dateStarted, dateEnded, thumbnailURI, bannerURI } = req.body;
    
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

    const hasEnded = (dateEnded && dateEnded.trim() !== "") ? 1 : 0;

    try {
        const result = await cataloguerModel.insertShow(titleObj, descriptionObj, dateStarted, dateEnded, hasEnded, thumbnailURI, bannerURI);
        return res.status(201).json({ message: "Serie creata con successo!", showId: result.id });
    } catch (err) {
        console.error("Errore addShow:", err);
        
        // ROLLBACK: Il DB è fallito, elimino le immagini orfane appena caricate!
        if (thumbnailURI) await fs.unlink(path.join(__dirname, '../public', thumbnailURI)).catch(() => {});
        if (bannerURI) await fs.unlink(path.join(__dirname, '../public', bannerURI)).catch(() => {});

        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// MODIFICA SERIE
// ==========================================
const modifyShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const showId = parseInt(req.params.id);
    // Aggiunti thumbnailURI e bannerURI per poterli aggiornare!
    const { title, description, dateEnded, lang, thumbnailURI, bannerURI } = req.body;

    const user = req.user;
    const applang = user.appLang;
    

    let fields = [];
    let params = [];
    let oldShow = null;

    if (title !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Title = json_set(Title, '$.${targetLang}', ?)`); 
        params.push(title); 
    }
    
    if (description !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Description = json_set(Description, '$.${targetLang}', ?)`); 
        params.push(description); 
    }
    
    if (dateEnded !== undefined) {
        fields.push('DateEnded = ?'); 
        params.push(dateEnded);

        const hasEnded = (dateEnded && dateEnded.trim() !== "") ? 1 : 0;
        fields.push('hasEnded = ?'); 
        params.push(hasEnded);
    }

    // Aggiungiamo i campi delle immagini alla query se sono stati inviati
    if (thumbnailURI !== undefined) {
        fields.push('ThumbnailURI = ?');
        params.push(thumbnailURI);
    }
    if (bannerURI !== undefined) {
        fields.push('BannerURI = ?');
        params.push(bannerURI);
    }

    if (fields.length === 0) return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });

    try {
        // 1. Leggiamo lo stato ATTUALE della serie prima di sovrascriverla (per sapere i vecchi URI)
        oldShow = await showModel.getShowByIdAuth(user.id, showId, applang);
        if (!oldShow) return res.status(404).json({ error: "La serie specificata non è stata trovata." });

        // 2. Aggiorniamo il DB
        const result = await cataloguerModel.updateShow(showId, fields, params);
        if (result.changes === 0) return res.status(400).json({ error: "Nessuna modifica effettuata." });

        // 3. NETTURBINO (Successo): Se hai caricato una NUOVA immagine, cancello quella VECCHIA per liberare spazio
        if (thumbnailURI && oldShow.ThumbnailURI && thumbnailURI !== oldShow.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', oldShow.ThumbnailURI)).catch(() => {});
        }
        if (bannerURI && oldShow.BannerURI && bannerURI !== oldShow.BannerURI) {
            await fs.unlink(path.join(__dirname, '../public', oldShow.BannerURI)).catch(() => {});
        }

        return res.json({ message: "Serie aggiornata con successo!" });

    } catch (err) {
        console.error("Errore modifyShow:", err);
        
        // ROLLBACK (Fallimento): Se l'update nel DB fallisce, elimino le NUOVE immagini caricate per sbaglio
        if (thumbnailURI && thumbnailURI !== oldShow?.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', thumbnailURI)).catch(() => {});
        }
        if (bannerURI && bannerURI !== oldShow?.BannerURI) {
            await fs.unlink(path.join(__dirname, '../public', bannerURI)).catch(() => {});
        }

        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CANCELLAZIONE SERIE
// ==========================================
const removeShow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const showId = parseInt(req.params.id);
    const user = req.user;
    const applang = user.appLang;

    try {
        // Recupero la serie PRIMA di cancellarla dal DB per avere in memoria gli URI
        const show = await showModel.getShowByIdAuth(user.id, showId, applang);
        if (!show) return res.status(404).json({ error: "La serie specificata non è stata trovata." });

        // Cancello la serie dal DB
        const result = await cataloguerModel.deleteShow(showId);
        if (result.changes === 0) return res.status(400).json({ error: "Impossibile cancellare la serie." });

        // Cancello fisicamente dal server tutte le immagini relative a questa serie!
        if (show.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', show.ThumbnailURI)).catch(() => {});
        }
        if (show.BannerURI) {
            await fs.unlink(path.join(__dirname, '../public', show.BannerURI)).catch(() => {});
        }

        return res.json({ message: "Serie e file multimediali cancellati con successo!" });
    } catch (err) {
        console.error("Errore removeShow:", err);
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
    const { title_it, title_en, title_jp, description_it, description_en, description_jp, dateStarted, dateEnded, seasonNumber, refShow } = req.body;
    
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

    //si calcola hasEnded anzichè passarla esplicitamente
    const hasEnded = (dateEnded && dateEnded.trim() !== "") ? 1 : 0;

    try {
        const result = await cataloguerModel.insertSeason(titleObj, descriptionObj, dateStarted, dateEnded, hasEnded, seasonNumber, refShow);
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
    const { title, description, dateEnded, refShow, lang } = req.body;

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
    if (dateEnded !== undefined) { 
        fields.push('DateEnded = ?'); 
        params.push(dateEnded); 

        //calcolo della hasEnded
        const hasEnded = (dateEnded && dateEnded.trim() !== "") ? 1 : 0;
        fields.push('hasEnded = ?'); 
        params.push(hasEnded);
    }
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
// CREAZIONE EPISODIO
// ==========================================
const addEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { 
        title_it, title_en, title_jp, 
        description_it, description_en, description_jp, 
        releaseDate, duration, refSeason, episodeNumber,
        DubLanguages, SubLanguages,
        thumbnailURI
    } = req.body;

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
            episodeNumber,
            DubLanguages, 
            SubLanguages,
            thumbnailURI
        );
        return res.status(201).json({ message: "Episodio creato con successo!", episodeId: result.id });
    } catch (err) {
        console.error("Errore addEpisode:", err);
        
        // ROLLBACK: Se l'inserimento nel DB fallisce, elimino la thumbnail orfana appena caricata
        if (thumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', thumbnailURI)).catch(() => {});
        }

        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// MODIFICA EPISODIO
// ==========================================
const modifyEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const episodeId = req.params.id;

    const user = req.user;
    const applang = user.appLang;
    
    const { title, description, refSeason, DubLanguages, SubLanguages, lang, thumbnailURI } = req.body;

    let fields = [];
    let fieldsParams = [];
    let oldEpisode = null;

    if (title !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Title = json_set(Title, '$.${targetLang}', ?)`); 
        fieldsParams.push(title); 
    }
    if (description !== undefined) { 
        const targetLang = lang || 'it';
        fields.push(`Description = json_set(Description, '$.${targetLang}', ?)`); 
        fieldsParams.push(description); 
    }
    
    if (refSeason !== undefined) { 
        fields.push('REF_SeasonID = ?'); 
        fieldsParams.push(refSeason); 
    }

    // Aggiungiamo il campo per la thumbnail se è stata inviata una modifica
    if (thumbnailURI !== undefined) {
        fields.push('ThumbnailURI = ?');
        fieldsParams.push(thumbnailURI);
    }

    if (fields.length === 0 && !DubLanguages && !SubLanguages) {
        return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });
    }

    try {
        // 1. Recupero i vecchi dati dell'episodio per sapere quale fosse la vecchia immagine
        // (Assicurati di avere questo metodo nel model corrispondente, ad es. episodeModel)
        oldEpisode = await episodeModel.getEpisodeById(episodeId, applang);
        if (!oldEpisode) return res.status(404).json({ error: "L'episodio specificato non è stato trovato." });

        // 2. Eseguo l'aggiornamento
        const result = await cataloguerModel.updateEpisodeFull(episodeId, fields, fieldsParams, DubLanguages, SubLanguages);
        
        // Attenzione: un update solo su Dub/Sub potrebbe avere fields.length === 0, quindi aggiustiamo il controllo
        if (fields.length > 0 && result.changes === 0 && !DubLanguages && !SubLanguages) {
             return res.status(400).json({ error: "Nessuna modifica effettuata." });
        }

        // 3. NETTURBINO (Successo): Cancello l'immagine vecchia se ne ho caricata una nuova
        if (thumbnailURI && oldEpisode.ThumbnailURI && thumbnailURI !== oldEpisode.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', oldEpisode.ThumbnailURI)).catch(() => {});
        }

        return res.json({ message: "Episodio aggiornato con successo!" });
    } catch (err) {
        console.error("Errore modifyEpisode:", err);

        // 4. ROLLBACK (Fallimento): Cancello la nuova immagine caricata per sbaglio se il DB va in crash
        if (thumbnailURI && thumbnailURI !== oldEpisode?.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', thumbnailURI)).catch(() => {});
        }

        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CANCELLAZIONE EPISODIO
// ==========================================
const removeEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const episodeId = req.params.id;

    const user = req.user;
    const applang = user.appLang;

    try {
        // 1. Estraggo i dati per ottenere la ThumbnailURI prima di cancellare la riga dal DB
        const episode = await episodeModel.getEpisodeById(episodeId, applang);
        if (!episode) return res.status(404).json({ error: "L'episodio specificato non è stato trovato." });

        // 2. Cancello l'episodio dal Database
        const result = await cataloguerModel.deleteEpisode(episodeId);
        if (result.changes === 0) return res.status(400).json({ error: "Impossibile cancellare l'episodio." });

        // 3. NETTURBINO: Cancello l'immagine fisica dal disco
        if (episode.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', episode.ThumbnailURI)).catch(() => {});
        }

        return res.json({ message: "Episodio cancellato con successo!" });
    } catch (err) {
        console.error("Errore removeEpisode:", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// CONTROLLER PROPIC
// ==========================================

const addPropic = async (req, res) => {
    // ==============================
    // ERROR HANDLING
    // ==============================
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMap = errors.mapped();

        if (errorMap.img) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (errorMap.bundle) {
            try {
                if (req.file) {
                    await fs.unlink(req.file.path).catch(() => {});
                } else {
                    return res.status(500).json({ error: "Nessun errore nel caricamento del file ma il file non esiste" });
                }
                return res.status(400).json({ error: errorMap.bundle.message })
            } catch (e){
                return res.status(500).json({ error: "Impossibile cancellare l'immagine orfana" })
            }
        }
    }
    
    // ==============================
    // SUCCESS HANDLING
    // ==============================
    filePath = req.file.path
    try {
        const { bundle } = req.body;
        const fileData = req.file;
        const publicPath = path.relative('public', fileData.path).replace(/\\/g, '/'); //per windows, visto che usa \ per il filesystem lo rimpiazziamo con / nell'uri
        
        const nuovaPropic = {
            bundle: bundle,
            propicURI: publicPath,
        };
        console.log('Salvataggio DB nuova Propic:', nuovaPropic);
        
        await cataloguerModel.insertPropic(nuovaPropic.bundle, nuovaPropic.propicURI)
        
        // Rispondi con successo ad Angular
        return res.json({ message: "Propic inserita con successo" });

    } catch (error) {
        console.error('Errore durante il salvataggio della propic nel DB:', error);
        try {
            await fs.unlink(filePath);
            console.log(`File orfano rimosso con successo: ${filePath}`);
        } catch (unlinkErr) {
            console.error(`Impossibile rimuovere il file ${filePath}:`, unlinkErr);
        }

        return res.status(500).json({ 
            error: "Errore interno del server durante il salvataggio" 
        });
    }
};

const removePropic = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
        const propicURI = req.body.propicURI;
        
        // Cancelliamo la riga dal Database
        const result = await cataloguerModel.deletePropicByURI(propicURI);
        if (result.changes === 0) return res.status(404).json({ error: "L'URI propic specificato non esiste." });

        // Cancelliamo fisicamente l'immagine dall'hard disk!
        // Ricostruiamo il percorso assoluto partendo dall'URI salvato nel DB
        const fullFilePath = path.join(__dirname, '../public', propicURI);
        
        await fs.unlink(fullFilePath).catch((err) => {
            // Usiamo il catch in modo silenzioso: se l'immagine era già stata cancellata a mano, non facciamo crashare l'API.
            console.log("Nota: Il file fisico non è stato trovato o era già stato rimosso.", err.message);
        });

        return res.json({ message: "Propic cancellata con successo dal DB e dal disco!" });
        
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