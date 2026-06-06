const db = require("../db/db");

// ==========================================
// RECUPERO DATI
// ==========================================
const getAllShows = async (search) => {
    let sql = `SELECT ShowID, Title, Description, DateStarted, DateEnded, hasEnded FROM Shows WHERE 1=1`;
    const params = [];
    if (search) {
        sql += ` AND Title LIKE ?`;
        params.push(`%${search}%`);
    }
    sql += ` ORDER BY Title ASC`;
    return await db.allAsync(sql, params);
};

const getAllSeasons = async (refShow) => {
    let sql = `SELECT SeasonID, Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID FROM Seasons WHERE 1=1`;
    const params = [];
    if (refShow) {
        sql += ` AND REF_ShowID = ?`;
        params.push(refShow);
    }
    sql += ` ORDER BY SeasonID ASC`;
    return await db.allAsync(sql, params);
};

const getAllEpisodes = async (refSeason) => {
    let sql = `SELECT EpisodeID, Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes FROM Episodes WHERE 1=1`;
    const params = [];
    if (refSeason) {
        sql += ` AND REF_SeasonID = ?`;
        params.push(refSeason);
    }
    sql += ` ORDER BY EpisodeID ASC`;
    return await db.allAsync(sql, params);
};

// ==========================================
// BI_LOGICA SERIE
// ==========================================

/**
 * Inserisce un nuovo show nel database con i testi multilingua in formato JSON
 * @param {Object} titleObj - Oggetto con le lingue (es. { it: "Nebbia", en: "Fog" })
 * @param {Object} descriptionObj - Oggetto con le lingue (es. { it: "Thriller...", en: "A thriller..." })
 * @param {string} dateStarted 
 * @param {string|null} dateEnded 
 * @param {number} hasEnded 
 * @returns {Promise<{id: number, changes: number}>}
 */


const insertShow = async (titleObj, descriptionObj, dateStarted, dateEnded, hasEnded, thumbnailURI, bannerURI) => {
    const sql = `INSERT INTO Shows (Title, Description, DateStarted, DateEnded, hasEnded, Favourited, ThumbnailURI, BannerURI) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`;
    
    // Convertiamo gli oggetti JavaScript in stringhe JSON per il database
    return await db.runAsync(sql, [
        JSON.stringify(titleObj), 
        JSON.stringify(descriptionObj), 
        dateStarted, 
        dateEnded || null, 
        hasEnded || 0,
        thumbnailURI,
        bannerURI
    ]);
};

/**
 * Aggiorna i campi di uno show. Supporta sia i campi normali che l'aggiornamento chirurgico di singole lingue JSON.
 * @param {number} showId 
 * @param {Array<string>} fields - Array di stringhe SQL (es. ["DateStarted = ?", "Title = json_set(Title, '$.en', ?)"])
 * @param {Array<any>} params - Vettore dei parametri da associare ai '?'
 * @returns {Promise<{id: number, changes: number}>}
 */


const updateShow = async (showId, fields, params) => {
    // La struttura dinamica rimane invariata, la magia la fa come componi l'array 'fields' nel controller
    const sql = `UPDATE Shows SET ${fields.join(', ')} WHERE ShowID = ?`;
    return await db.runAsync(sql, [...params, showId]);
};

/**
 * Elimina uno show e attiva il CASCADE su stagioni ed episodi
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */


const deleteShow = async (showId) => {
    const sql = `DELETE FROM Shows WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

module.exports = {
    insertShow,
    updateShow,
    deleteShow
};

// ==========================================
// BI_LOGICA STAGIONI
// ==========================================

/**
 * Inserisce una nuova stagione nel database con i testi multilingua in formato JSON
 * @param {Object} titleObj - Oggetto con le lingue (es. { it: "Stagione 1", en: "Season 1" })
 * @param {Object} descriptionObj - Oggetto con le lingue (es. { it: "Desc...", en: "Desc..." })
 * @param {string} dateStarted 
 * @param {string|null} dateEnded 
 * @param {number} hasEnded 
 * @param {number} refShow - ID dello Show associato
 * @returns {Promise<{id: number, changes: number}>}
 */


const insertSeason = async (titleObj, descriptionObj, dateStarted, dateEnded, hasEnded, seasonNumber, refShow) => {
    const sql = `INSERT INTO Seasons (Title, Description, DateStarted, DateEnded, hasEnded, SeasonNumber, REF_ShowID) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    // Convertiamo gli oggetti JavaScript in stringhe JSON prima di inviarli a SQLite
    return await db.runAsync(sql, [
        JSON.stringify(titleObj), 
        JSON.stringify(descriptionObj), 
        dateStarted, 
        dateEnded || null, 
        hasEnded || 0, 
        seasonNumber,
        refShow
    ]);
};

/**
 * Aggiorna i campi di una stagione, supportando l'aggiornamento parziale delle singole lingue nel JSON
 * @param {number} seasonId 
 * @param {Array<string>} fields - Array di stringhe SQL (es. ["DateStarted = ?", "Title = json_set(Title, '$.en', ?)"])
 * @param {Array<any>} params - Vettore dei parametri da associare ai '?'
 * @returns {Promise<{id: number, changes: number}>}
 */


const updateSeason = async (seasonId, fields, params) => {
    const sql = `UPDATE Seasons SET ${fields.join(', ')} WHERE SeasonID = ?`;
    return await db.runAsync(sql, [...params, seasonId]);
};

/**
 * Elimina una stagione e attiva il CASCADE in automatico su tutti gli episodi figli
 * @param {number} seasonId 
 * @returns {Promise<{id: number, changes: number}>}
 */


const deleteSeason = async (seasonId) => {
    const sql = `DELETE FROM Seasons WHERE SeasonID = ?`;
    return await db.runAsync(sql, [seasonId]);
};

// ==========================================
// BI_LOGICA EPISODI
// ==========================================

/**
 * Inserisce un nuovo episodio inserendo i testi multilingua in JSON e popolando le tabelle pivot di tracce audio e sottotitoli
 * @param {Object} titleObj - Oggetto lingue titolo (es. { it: "Ep. 1", en: "Ep. 1" })
 * @param {Object} descriptionObj - Oggetto lingue descrizione
 * @param {string} releaseDate 
 * @param {number} duration 
 * @param {number} refSeason 
 * @param {Array<string>} dubs - Array di codici lingua (es. ['it', 'en'])
 * @param {Array<string>} subs - Array di codici lingua sottotitoli
 * @returns {Promise<Object>} Il risultato del runAsync della tabella principale (contiene l'id)
 */

const insertEpisodeFull = async (titleObj, descriptionObj, releaseDate, duration, refSeason, episodeNumber, dubs, subs, thumbnailURI) => {
    const sql = `INSERT INTO Episodes (Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes, EpisodeNumber, ThumbnailURI) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`;
    
    // Convertiamo gli oggetti multilingua in stringhe JSON
    const result = await db.runAsync(sql, [
        JSON.stringify(titleObj), 
        JSON.stringify(descriptionObj), 
        releaseDate, 
        duration, 
        refSeason,
        episodeNumber,
        thumbnailURI
    ]);
    const newEpisodeId = result.id;

    // Inserimento Tracce Audio (Sincronizzato con initdb.sql)
    if (dubs && Array.isArray(dubs)) {
        for (const lang of dubs) {
            await db.runAsync(`INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "REF_LanguageID") VALUES (?, ?)`, [newEpisodeId, lang]);
        }
    }
    // Inserimento Sottotitoli (Sincronizzato con initdb.sql)
    if (subs && Array.isArray(subs)) {
        for (const lang of subs) {
            await db.runAsync(`INSERT INTO "EpisodeSubtitles" ("REF_EpisodeID", "REF_LanguageID") VALUES (?, ?)`, [newEpisodeId, lang]);
        }
    }
    return result;
};

/**
 * Aggiorna i campi di un episodio. Supporta l'aggiornamento parziale delle lingue nel JSON e sincronizza le tabelle pivot di lingue/sottotitoli.
 * @param {number} episodeId 
 * @param {Array<string>} fields - Array di stringhe SQL (es. ["ReleaseDate = ?", "Title = json_set(Title, '$.en', ?)"])
 * @param {Array<any>} fieldsParams - Parametri per la query di UPDATE
 * @param {Array<string>|null} dubs - Nuova lista delle lingue audio (se modificata)
 * @param {Array<string>|null} subs - Nuova lista dei sottotitoli (se modificata)
 * @returns {Promise<Object>}
 */

const updateEpisodeFull = async (episodeId, fields, fieldsParams, dubs, subs) => {
    let result = { changes: 1 };
    
    // 1. Aggiornamento della tabella principale Episodes (campi standard o singole chiavi JSON)
    if (fields.length > 0) {
        const sql = `UPDATE Episodes SET ${fields.join(', ')} WHERE EpisodeID = ?`;
        result = await db.runAsync(sql, [...fieldsParams, episodeId]);
    }

    // 2. Se l'episodio esiste/è stato modificato, sincronizziamo le relazioni esterne
    if (result.changes > 0) {
        // Tracce Audio: Svuota e ripopola
        if (dubs && Array.isArray(dubs)) {
            await db.runAsync(`DELETE FROM "EpisodeLanguage" WHERE "REF_EpisodeID" = ?`, [episodeId]);
            for (const lang of dubs) {
                await db.runAsync(`INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "REF_LanguageID") VALUES (?, ?)`, [episodeId, lang]);
            }
        }
        // Sottotitoli: Svuota e ripopola
        if (subs && Array.isArray(subs)) {
            await db.runAsync(`DELETE FROM "EpisodeSubtitles" WHERE "REF_EpisodeID" = ?`, [episodeId]);
            for (const lang of subs) {
                await db.runAsync(`INSERT INTO "EpisodeSubtitles" ("REF_EpisodeID", "REF_LanguageID") VALUES (?, ?)`, [episodeId, lang]);
            }
        }
    }
    return result;
};

/**
 * Elimina un episodio dal DB. Attiva il CASCADE automatico su tabelle pivot, skip-times e risoluzioni.
 * @param {number} episodeId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const deleteEpisode = async (episodeId) => {
    const sql = `DELETE FROM Episodes WHERE EpisodeID = ?`;
    return await db.runAsync(sql, [episodeId]);
};

// ==========================================
// BI_LOGICA PROPIC
// ==========================================
/**
 * Aggiunge un URI propic al DB.
 * @param {number} bundle 
 * @param {number} propicURI
 * @returns {Promise<{id: number, changes: number}>}
 */
const insertPropic = async (bundle, propicURI) => {
    const sql = `INSERT INTO Propics (Bundle, PropicURI) VALUES (?, ?)`;
    return await db.runAsync(sql, [bundle, propicURI]);
};

/**
 * Cancella un URI propic dal DB, prendendo come argomento l'URI.
 * @param {number} propicURI 
 * @returns {Promise<{id: number, changes: number}>}
 */
const deletePropicByURI = async (propicURI) => {
    const sql = `DELETE FROM Propics WHERE PropicURI = ?`;
    return await db.runAsync(sql, [propicURI]);
};

module.exports = {
    getAllShows,
    getAllSeasons,
    getAllEpisodes,
    insertShow,
    updateShow,
    deleteShow,
    insertSeason,
    updateSeason,
    deleteSeason,
    insertEpisodeFull,
    updateEpisodeFull,
    deleteEpisode,
    insertPropic,
    deletePropicByURI
};