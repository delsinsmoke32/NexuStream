const db = require("../db/db");

/**
 * Cerca gli show in base al titolo o alla descrizione localizzati nel JSON, calcolando un punteggio di rilevanza
 * Non serve più il GROUP BY poiché non ci sono tabelle di descrizione separate a creare duplicati
 * @param {string} queryParam - Il termine di ricerca formattato con i % (es. "%breaking%")
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
/**
 * Cerca gli show in base al titolo, alla descrizione e/o al genere
 * @param {string} searchParam - Il termine di ricerca formattato con i % (es. "%breaking%"). Passa "%" (o null) per prendere tutto.
 * @param {number|string|null} genreParam - L'ID del genere o il suo Nome (opzionale)
 * @param {string} applang - La lingua rilevata (es. "it")
 * @returns {Promise<Array<Object>>}
 */
const searchShows = async (searchParam, genreParam, applang = 'it') => {
    // Garantiamo un fallback di ricerca globale se il parametro di ricerca è vuoto
    const safeSearch = searchParam || '%';

    // 1. Costruiamo la SELECT di base
    let sql = `
    SELECT s.ShowID, s.DateStarted, s.hasEnded, s.DateEnded, s.Favourited, s.ThumbnailURI, s.BannerURI,
        
        -- Il titolo e la descrizione mostrati all'utente saranno RIGIDAMENTE nella sua lingua (o italiano fallback)
        COALESCE(s.Title->>?, s.Title->>'it') AS Title,
        COALESCE(s.Description->>?, s.Description->>'it') AS Description,
        
        -- Il punteggio di rilevanza premia se il match avviene nella lingua preferita dell'utente
        (
            CASE WHEN COALESCE(s.Title->>?, s.Title->>'it') LIKE ? THEN 10 
                 WHEN s.Title LIKE ? THEN 7 -- Match sul titolo ma in un'altra lingua
                 ELSE 0 END +
            CASE WHEN COALESCE(s.Description->>?, s.Description->>'it') LIKE ? THEN 2 
                 WHEN s.Description LIKE ? THEN 1 -- Match sulla descrizione in un'altra lingua
                 ELSE 0 END
        ) AS RelevanceScore

    FROM Shows AS s
    `;
    
    // Array dei parametri della SELECT (vanno sempre inseriti)
    const params = [
        applang, applang,       // Per estrarre Titolo e Descrizione nella lingua giusta
        applang, safeSearch,    // CASE WHEN Titolo lingua utente (10 punti)
        safeSearch,             // CASE WHEN Titolo qualsiasi altra lingua (7 punti)
        applang, safeSearch,    // CASE WHEN Descrizione lingua utente (2 punti)
        safeSearch              // CASE WHEN Descrizione qualsiasi altra lingua (1 punto)
    ];

    // 2. Aggiungiamo le JOIN solo se abbiamo bisogno di filtrare per genere
    if (genreParam) {
        sql += `
        JOIN LINKs_Show_Has_Genre AS link ON s.ShowID = link.REF_ShowID
        JOIN Genres AS g ON link.REF_GenreID = g.GenreID
        `;
    }

    // 3. Applichiamo i filtri WHERE dinamici
    sql += ` WHERE (s.Title LIKE ? OR s.Description LIKE ?) `;
    params.push(safeSearch, safeSearch);

    // Se esiste il parametro genere, aggiungiamo la condizione
    if (genreParam) {
        // Riconosce automaticamente se hai passato un ID numerico (es. 5) o una Stringa (es. "Action")
        if (!isNaN(genreParam)) {
            sql += ` AND g.GenreID = ? `;
        } else {
            sql += ` AND g.Name = ? `;
        }
        params.push(genreParam);
    }

    // 4. Chiudiamo la query
    sql += `
    GROUP BY s.ShowID
    ORDER BY RelevanceScore DESC, Title ASC`;
    
    return await db.allAsync(sql, params);
};
/**
 * Prende le 20 serie con più favorites estraendo titolo e descrizione localizzati
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
const getTopFavorited = async (applang = 'it') => {
    const sql = `
        SELECT 
            s.ShowID, s.DateStarted, s.hasEnded, s.DateEnded, s.Favourited, s.ThumbnailURI, s.BannerURI,
            COALESCE(s.Title->>?, s.Title->>'it') AS Title,
            COALESCE(s.Description->>?, s.Description->>'it') AS Description
        FROM Shows AS s
        ORDER BY s.Favourited DESC
        LIMIT 20`;
    return await db.allAsync(sql, [applang, applang]);
};

// Recupera i generi della serie
const getShowGenres = async (showId) => {
    const sql = `
        SELECT g.Name 
        FROM Genres g
        JOIN LINKs_Show_Has_Genre l ON g.GenreID = l.REF_GenreID
        WHERE l.REF_ShowID = ?`;
    return await db.allAsync(sql, [showId]);
};

// Trova l'ID del primissimo episodio in assoluto
const getFirstEpisodeOfShow = async (showId) => {
    const sql = `
        SELECT e.EpisodeID 
        FROM Episodes e
        JOIN Seasons s ON e.REF_SeasonID = s.SeasonID
        WHERE s.REF_ShowID = ?
        ORDER BY s.SeasonNumber ASC, e.EpisodeNumber ASC
        LIMIT 1`;
    return await db.getAsync(sql, [showId]);
};

// Recupera le tracce audio (DUB)
const getEpisodeAudio = async (episodeId) => {
    return await db.allAsync(`SELECT REF_LanguageID FROM EpisodeLanguage WHERE REF_EpisodeID = ?`, [episodeId]);
};

// Recupera i sottotitoli (SUB)
const getEpisodeSubs = async (episodeId) => {
    return await db.allAsync(`SELECT REF_LanguageID FROM EpisodeSubtitles WHERE REF_EpisodeID = ?`, [episodeId]);
};



/**
 * Prende le 20 serie con più stream calcolando la somma degli episodi e localizzando lo show
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
const getTopStreamed = async (applang = 'it') => {
    const sql = `
        SELECT 
            sh.ShowID, sh.DateStarted, sh.hasEnded, sh.DateEnded, sh.Favourited, sh.ThumbnailURI, sh.BannerURI,
            COALESCE(sh.Title->>?, sh.Title->>'it') AS Title,
            COALESCE(sh.Description->>?, sh.Description->>'it') AS Description,
            SUM(e.Streams) AS TotalStreams
        FROM Shows AS sh
        JOIN Seasons AS s ON s.REF_ShowID = sh.ShowID
        JOIN Episodes AS e ON e.REF_SeasonID = s.SeasonID
        GROUP BY sh.ShowID
        ORDER BY TotalStreams DESC
        LIMIT 20`;
    return await db.allAsync(sql, [applang, applang]);
};

/**
 * Prende i 10 episodi più recenti nel "Continua a guardare" dell'utente
 * Collassa i duplicati per Show ed estrae i titoli localizzati dai rispettivi JSON
 * @param {number} userId 
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
const getContinueWatching = async (userId, applang = 'it') => {
    const sql = `
        SELECT 
            sh.ShowID, sh.ThumbnailURI, sh.BannerURI,
            s.SeasonID,
            COALESCE(sh.Title->>?, sh.Title->>'it') AS ShowTitle,
            e.EpisodeID, 
            COALESCE(e.Title->>?, e.Title->>'it') AS EpisodeTitle,
            ui.Progress, 
            MAX(ui.LastWatchedDate) AS LastWatchedDate
        FROM LINKs_User_Interacts_Episode AS ui
        JOIN Episodes AS e ON ui.REF_EpisodeID = e.EpisodeID
        JOIN Seasons AS s ON e.REF_SeasonID = s.SeasonID
        JOIN Shows AS sh ON s.REF_ShowID = sh.ShowID
        WHERE ui.REF_UserID = ? AND ui.isCompleted = 0 AND ui.isDropped = 0
        GROUP BY sh.ShowID
        ORDER BY LastWatchedDate DESC
        LIMIT 10`;
    return await db.allAsync(sql, [applang, applang, userId]);
};

/**
 * Trova uno show in base al suo id localizzandone i testi
 * @param {number} showId 
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Object|null>}
 */
const getShowByIdNoAuth = async (showId, applang = 'it') => {
    const sql = `
        SELECT 
            ShowID, DateStarted, hasEnded, DateEnded, Favourited, ThumbnailURI, BannerURI,
            0 AS isFavorited,
            COALESCE(Title->>?, Title->>'it') AS Title,
            COALESCE(Description->>?, Description->>'it') AS Description
        FROM Shows as s
        WHERE ShowID = ?`;
    return await db.getAsync(sql, [applang, applang, showId]);
};

const getShowByIdAuth = async (userId, showId, applang = 'it') => {
    const sql = `
        SELECT 
            s.ShowID, s.DateStarted, s.hasEnded, s.DateEnded, s.Favourited, s.ThumbnailURI, s.BannerURI,
            COALESCE(s.Title->>?, s.Title->>'it') AS Title,
            COALESCE(s.Description->>?, s.Description->>'it') AS Description,
            CASE WHEN l.REF_ShowID IS NOT NULL THEN 1 ELSE 0 END AS isFavorited
        FROM Shows AS s
        LEFT JOIN LINKs_User_Likes_Show AS l ON s.ShowID = l.REF_ShowID AND l.REF_UserID = ?
        WHERE s.ShowID = ?`;
    return await db.getAsync(sql, [applang, applang, userId, showId]);
};

/**
 * Trova un'interazione di favorite fra utente e show basandosi sui rispettivi id
 * @param {number} userId 
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */
const addLikeInteraction = async (userId, showId) => {
    const sql = `INSERT OR IGNORE INTO LINKs_User_Likes_Show(REF_UserID, REF_ShowID) VALUES (?, ?)`;
    return await db.runAsync(sql, [userId, showId]);
};

/**
 * Rimuove un'interazione di favorite fra utente e show basandosi sui rispettivi id
 * @param {number} userId 
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */
const removeLikeInteraction = async (userId, showId) => {
    const sql = `DELETE FROM LINKs_User_Likes_Show WHERE REF_UserID = ? AND REF_ShowID = ?`;
    return await db.runAsync(sql, [userId, showId]);
};

/**
 * Incrementa il contatore dei favorite di una serie
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */
const incrementFavorites = async (showId) => {
    const sql = `UPDATE Shows SET Favourited = Favourited + 1 WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

/**
 * Decrementa il contatore dei favorite di una serie
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */
const decrementFavorites = async (showId) => {
    const sql = `UPDATE Shows SET Favourited = Favourited - 1 WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

module.exports = {
    searchShows,
    getShowGenres,
    getFirstEpisodeOfShow,
    getEpisodeSubs,
    getEpisodeAudio,
    getTopStreamed,
    getTopFavorited,
    getContinueWatching,
    getShowByIdNoAuth,
    getShowByIdAuth,
    addLikeInteraction,
    removeLikeInteraction,
    incrementFavorites,
    decrementFavorites
};