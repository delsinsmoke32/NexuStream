const cataloguerModel = require('../models/cataloguerModel');
const showModel = require('../models/showModel');
const episodeModel = require('../models/episodeModel');
const discussionModel = require('../models/discussionModel');
const { validationResult, check } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const multerConfig = require("../middleware/multerConfig");
const videoProcessor = require("../utils/videoProcessor");

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
    
    // Calcolo della paginazione
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
    const applang = req.language;
    

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
    const applang = req.language;

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
        
        // Se la stagione è già conclusa, genera le discussioni
        if (hasEnded === 1) {
            await discussionModel.autoCreateSeasonDiscussions(result.id);
        }

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
        
        // Se l'aggiornamento ha toccato dateEnded e impostato hasEnded = 1, crea le discussioni
        if (dateEnded !== undefined) {
            const hasEnded = (dateEnded && dateEnded.trim() !== "") ? 1 : 0;
            if (hasEnded === 1) {
                await discussionModel.autoCreateSeasonDiscussions(seasonId);
                console.log(`[BACKEND] Stagione ${seasonId} chiusa: generate discussioni post-season.`);
            }
        }

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
        thumbnailURI,
        rawVideoURI,
        audioTracks, 
        subTracks,
        times   
    } = req.body;

    console.log("=== DATI RICEVUTI DAL FRONTEND ===");
    console.log("Audio Tracks:", req.body.audioTracks);
    console.log("Sub Tracks:", req.body.subTracks);

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
        const finalDubs = [];
        if (audioTracks && audioTracks.length > 0) {
            audioTracks.forEach(track => {
                if (!finalDubs.includes(track.lang)) finalDubs.push(track.lang);
            });
        }

        const finalSubs = [];
        if (subTracks && subTracks.length > 0) {
            subTracks.forEach(track => {
                if (!finalSubs.includes(track.lang)) finalSubs.push(track.lang);
            });
        }

        const streamURI = 'stream-' + Date.now() + '-' + Math.round(Math.random() * 1E9)
        // 1. Salviamo l'episodio nel Database passando le lingue appena calcolate
        const result = await cataloguerModel.insertEpisodeFull(
            titleObj, 
            descriptionObj, 
            releaseDate, 
            duration, 
            refSeason, 
            episodeNumber,
            finalDubs, 
            finalSubs, 
            thumbnailURI,
            streamURI
        );

        const episodeId = parseInt(result.id, 10);

        // Crea in automatico una discussione standard per l'episodio
        await discussionModel.autoCreateEpisodeDiscussion(episodeId);

        if (times && Array.isArray(times)) {
            try {
                // Usiamo la funzione del model che fa rigenera i tempi dell'ep
                await episodeModel.updateEpisodeTimes(episodeId, times);
            } catch (err) {
                console.error("Errore salvataggio marker durante la creazione:", err);
            }
        }

        // Spostiamo fisicamente i file temporanei audio e sub nella cartella dell'episodio
        if (audioTracks && audioTracks.length > 0) {
            for (let track of audioTracks) {
                const tempPath = path.join(__dirname, '../public', track.uri);
                // Sposta il file mp3/aac in public/videos/34/audio_en.mp3
                await videoProcessor.moveMediaFile(tempPath, streamURI, 'audio', track.lang);
                console.log(`[BACKEND] Traccia audio spostata con successo per lingua: ${track.lang}`);
            }
        }
        
        if (subTracks && subTracks.length > 0) {
            for (let track of subTracks) {
                const tempPath = path.join(__dirname, '../public', track.uri);
                // Sposta il file vtt nella cartella corrispondente
                await videoProcessor.moveMediaFile(tempPath, streamURI, 'subs', track.lang);
                console.log(`[BACKEND] Sottotitolo spostato con successo per lingua: ${track.lang}`);
            }
        }

        // Avviamo la transcodifica video in background
        if (rawVideoURI) {
            const absoluteTempVideoPath = path.join(__dirname, '../public', rawVideoURI);
            
            videoProcessor.processVideoHLS(absoluteTempVideoPath, streamURI)
                .then(async () => {
                    console.log(`[BACKGROUND] Episodio ${episodeId} elaborato e pronto allo streaming!`);
                    try {
                        await fs.unlink(absoluteTempVideoPath);
                        console.log(`[BACKGROUND] File temporaneo eliminato.`);
                    } catch (err) {}
                })
                .catch(err => console.error(`[BACKGROUND] Errore FFmpeg:`, err));
        }

        return res.status(201).json({ message: "Episodio creato con successo!", episodeId });
        
    } catch (err) {
        console.error("Errore addEpisode:", err);
        // Rollback...
        if (thumbnailURI) await fs.unlink(path.join(__dirname, '../public', thumbnailURI)).catch(() => {});
        if (rawVideoURI) await fs.unlink(path.join(__dirname, '../public', rawVideoURI)).catch(() => {});
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// MODIFICA EPISODIO
// ==========================================
const modifyEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const episodeId = parseInt(req.params.id, 10);
    const user = req.user;
    const applang = req.language;
    
    const { 
        title, description, refSeason, lang, thumbnailURI,
        DubLanguages, SubLanguages,
        audioTracks, 
        subTracks,
        times    
    } = req.body;

    let fields = [];
    let fieldsParams = [];
    let oldEpisode = null;

    if (title !== undefined) { 
        fields.push(`Title = json_set(Title, '$.${lang || 'it'}', ?)`); 
        fieldsParams.push(title); 
    }
    if (description !== undefined) { 
        fields.push(`Description = json_set(Description, '$.${lang || 'it'}', ?)`); 
        fieldsParams.push(description); 
    }
    if (refSeason !== undefined) { fields.push('REF_SeasonID = ?'); fieldsParams.push(refSeason); }
    if (thumbnailURI !== undefined) { fields.push('ThumbnailURI = ?'); fieldsParams.push(thumbnailURI); }

    if (fields.length === 0 && !DubLanguages && !SubLanguages && !thumbnailURI && !audioTracks && !subTracks) {
        return res.status(400).json({ message: "Inserisci qualche parametro da modificare." });
    }

    try {
        oldEpisode = await episodeModel.getEpisodeById(episodeId, applang);
        if (!oldEpisode) return res.status(404).json({ error: "Episodio non trovato." });
        const streamURI = oldEpisode.StreamURI;

        if (fields.length > 0 || DubLanguages || SubLanguages) {
            await cataloguerModel.updateEpisodeFull(episodeId, fields, fieldsParams, DubLanguages, SubLanguages);
        }

        if (thumbnailURI && oldEpisode.ThumbnailURI && thumbnailURI !== oldEpisode.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', oldEpisode.ThumbnailURI)).catch(() => {});
        }

        if (times && Array.isArray(times)) {
            try {
                await episodeModel.updateEpisodeTimes(episodeId, times);
            } catch (err) {
                console.error("Errore salvataggio marker durante la modifica:", err);
            }
        }

        // SPOSTAMENTO NUOVE TRACCE AUDIO E SOTTOTITOLI E REGISTRAZIONE NEL DB
        if (audioTracks && audioTracks.length > 0) {
            for (let track of audioTracks) {
                const tempPath = path.join(__dirname, '../public', track.uri);
                
                // 1. Sposta e segmenta il file con FFmpeg
                await videoProcessor.moveMediaFile(tempPath, streamURI, 'audio', track.lang);
                
                // 2. Registra la lingua nel Database! (Se esiste già, la ignora senza dare errore)
                await cataloguerModel.insertDubLang(episodeId, track.lang);
                
                console.log(`[BACKEND] Nuova traccia audio ${track.lang} registrata nel DB per l'episodio ${episodeId}`);
            }
        }
        
        if (subTracks && subTracks.length > 0) {
            for (let track of subTracks) {
                const tempPath = path.join(__dirname, '../public', track.uri);
                
                // 1. Sposta e segmenta il VTT
                await videoProcessor.moveMediaFile(tempPath, streamURI, 'subs', track.lang);
                
                // 2. Registra il sottotitolo nel Database!
                await cataloguerModel.insertSubLang(episodeId, track.lang);

                console.log(`[BACKEND] Nuovi sottotitoli ${track.lang} registrati nel DB per l'episodio ${episodeId}`);
            }
        }

        return res.json({ message: "Episodio aggiornato con successo!" });
    } catch (err) {
        console.error("Errore modifyEpisode:", err);
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
    
    const episodeId = parseInt(req.params.id, 10);

    const user = req.user;
    const applang = req.language;

    try {
        // 1. Estraggo i dati per ottenere la ThumbnailURI prima di cancellare la riga dal DB
        const episode = await episodeModel.getEpisodeById(episodeId, applang);
        if (!episode) return res.status(404).json({ error: "L'episodio specificato non è stato trovato." });

        // 2. Cancello l'episodio dal Database
        const result = await cataloguerModel.deleteEpisode(episodeId);
        if (result.changes === 0) return res.status(400).json({ error: "Impossibile cancellare l'episodio." });

        // 3. NETTURBINO IMMAGINI: Cancello l'immagine fisica dal disco
        if (episode.ThumbnailURI) {
            await fs.unlink(path.join(__dirname, '../public', episode.ThumbnailURI)).catch(() => {});
        }

        const streamURI = episode.streamURI;
        // 4. NETTURBINO VIDEO: Rado al suolo l'intera cartella HLS (video, audio e sub)
        const hlsFolder = path.join(__dirname, '../public/videos', String(streamURI));
        await fs.rm(hlsFolder, { recursive: true, force: true }).catch((err) => {
            console.log(`[NETTURBINO] Nessuna cartella video trovata per episodio ${episodeId} o già eliminata.`);
        });

        return res.json({ message: "Episodio e relativi file multimediali cancellati con successo!" });
    } catch (err) {
        console.error("Errore removeEpisode:", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

// ==========================================
// ELIMINA SINGOLA TRACCIA (AUDIO O SUB)
// ==========================================
const removeTrack = async (req, res) => {
    const { id, type, lang } = req.params;

    try {
        // 1. Eliminiamo dal Database
        if (type === 'audio') {
            await cataloguerModel.deleteDubLang(id, lang);
        } else if (type === 'subs') {
            await cataloguerModel.deleteSubLang(id, lang);
        } else {
            return res.status(400).json({ error: "Tipo traccia non valido." });
        }

        // 2. Eliminiamo fisicamente la cartella HLS di quella specifica lingua
        // Es: public/videos/19/audio_en oppure subs_en
        const { StreamURI } = await episodeModel.getEpisodeURI(id);
        if (!StreamURI) {
            return res.status(400).json({ error: "Impossibile trovare la stream per l'episodio" });
        }
        const folderPrefix = type === 'audio' ? 'audio_' : 'subs_';
        const targetFolder = path.join(__dirname, '../public/videos', StreamURI, `${folderPrefix}${lang}`);

        await fs.rm(targetFolder, { recursive: true, force: true }).catch(() => {
            console.log(`[NETTURBINO TRACCE] Cartella ${targetFolder} non trovata, ma DB aggiornato.`);
        });

        return res.json({ message: `Traccia ${type} in ${lang} eliminata con successo!` });
    } catch (err) {
        console.error("Errore removeTrack:", err);
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
        const fallbackURI = "avatars/avatar-003.png"
        if (propicURI == fallbackURI) {
            return res.status(400).json({ error: "Impossibile cancellare questa propic." });
        }
        const tmp = await cataloguerModel.updateMemberPropicBeforeDeletion(propicURI, fallbackURI)
        console.log(`Modificata la propic a ${tmp.changes} utenti prima della cancellazione`)
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
    addEpisode, modifyEpisode, removeEpisode, removeTrack,
    addPropic, removePropic
};