const db = require("../db/db");

/**
 * Cerca gli show in base al titolo o alla descrizione localizzati nel JSON, calcolando un punteggio di rilevanza
 * Non serve più il GROUP BY poiché non ci sono tabelle di descrizione separate a creare duplicati
 * @param {string} queryParam - Il termine di ricerca formattato con i % (es. "%breaking%")
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
const searchShows = async (queryParam, applang = 'it') => {
    const sql = `
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
    WHERE s.Title LIKE ? OR s.Description LIKE ?   
    GROUP BY s.ShowID -- evita duplicati
    ORDER BY RelevanceScore DESC, Title ASC`;
    
    // Mappatura ordinata dei parametri per i segnaposto '?'
    const params = [
        applang, applang,       // Per la SELECT (Mostra i testi nella lingua dell'utente)
        
        applang, queryParam,    // CASE WHEN Titolo lingua utente (10 punti)
        queryParam,             // CASE WHEN Titolo qualsiasi altra lingua (7 punti)
        
        applang, queryParam,    // CASE WHEN Descrizione lingua utente (2 punti)
        queryParam,             // CASE WHEN Descrizione qualsiasi altra lingua (1 punto)
        
        queryParam,             // WHERE: Cerca in tutto il JSON del Titolo
        queryParam              // WHERE: Cerca in tutto il JSON della Descrizione
    ];
    
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
            sh.ShowID, 
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
const getShowById = async (showId, applang = 'it') => {
    const sql = `
        SELECT 
            ShowID, DateStarted, hasEnded, DateEnded, Favourited, ThumbnailURI, BannerURI,
            COALESCE(Title->>?, Title->>'it') AS Title,
            COALESCE(Description->>?, Description->>'it') AS Description
        FROM Shows 
        WHERE ShowID = ?`;
    return await db.getAsync(sql, [applang, applang, showId]);
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
    getTopStreamed,
    getTopFavorited,
    getContinueWatching,
    getShowById,
    addLikeInteraction,
    removeLikeInteraction,
    incrementFavorites,
    decrementFavorites
};