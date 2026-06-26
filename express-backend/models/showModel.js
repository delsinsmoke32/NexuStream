const db = require("../db/db");


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
        
        -- Il punteggio di rilevanza aumenta se il match avviene nella lingua preferita dell'utente
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
    
   
    const params = [
        applang, applang,       // Per estrarre Titolo e Descrizione nella lingua giusta
        applang, safeSearch,    // CASE WHEN Titolo lingua utente (10 punti)
        safeSearch,             // CASE WHEN Titolo qualsiasi altra lingua (7 punti)
        applang, safeSearch,    // CASE WHEN Descrizione lingua utente (2 punti)
        safeSearch              // CASE WHEN Descrizione qualsiasi altra lingua (1 punto)
    ];

    
    if (genreParam) {
        sql += `
        JOIN LINKs_Show_Has_Genre AS link ON s.ShowID = link.REF_ShowID
        JOIN Genres AS g ON link.REF_GenreID = g.GenreID
        `;
    }

    
    sql += ` WHERE (s.Title LIKE ? OR s.Description LIKE ?) `;
    params.push(safeSearch, safeSearch);

    if (genreParam) {
        if (!isNaN(genreParam)) {
            sql += ` AND g.GenreID = ? `;
        } else {
            sql += ` AND g.Name = ? `;
        }
        params.push(genreParam);
    }

   
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

// Trova l'ID del primo ep
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

// Recupera le tracce audio
const getEpisodeAudio = async (episodeId) => {
    return await db.allAsync(`SELECT REF_LanguageID FROM EpisodeLanguage WHERE REF_EpisodeID = ?`, [episodeId]);
};

// Recupera i sottotitoli
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
 * Recupera gli show che hanno discussioni aperte, 
 * ordinati per la discussione più recente.
 * @param {string} applang - La lingua rilevata (es. "en")
 * @returns {Promise<Array<Object>>}
 */
const getShowsWithRecentOpenDiscussions = async (applang = 'it') => {
    const sql = `
        SELECT 
            sh.ShowID, sh.ThumbnailURI, sh.BannerURI,
            COALESCE(sh.Title->>?, sh.Title->>'it') AS Title,
            COALESCE(sh.Description->>?, sh.Description->>'it') AS Description,
            MAX(d.OpenDate) AS LatestDiscussionDate
        FROM Shows AS sh
        JOIN Seasons AS s ON sh.ShowID = s.REF_ShowID
        JOIN Episodes AS e ON s.SeasonID = e.REF_SeasonID
        JOIN Discussions AS d ON e.EpisodeID = d.REF_EpisodeID
        WHERE d.ForceClosed = 0 
          AND (d.CloseDate > CURRENT_TIMESTAMP)
        GROUP BY sh.ShowID
        ORDER BY LatestDiscussionDate DESC
        LIMIT 20`;
        
    const res = await db.allAsync(sql, [applang, applang]);
    
    return res;
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
            sh.ShowID, sh.ThumbnailURI, sh.BannerURI, e.ThumbnailURI AS EpisodeThumbnailURI, 
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
            CASE WHEN l.REF_ShowID IS NOT NULL THEN 1 ELSE 0 END AS isFavorited,
            
            cw.EpisodeID AS ResumeEpisodeID,
            cw.EpisodeNumber AS ResumeEpisodeNumber,
            cw.SeasonID AS ResumeSeasonID,
            cw.SeasonNumber AS ResumeSeasonNumber,
            cw.Progress AS ResumeProgress

        FROM Shows AS s
        LEFT JOIN LINKs_User_Likes_Show AS l ON s.ShowID = l.REF_ShowID AND l.REF_UserID = ?
        
       
        
        LEFT JOIN (
            SELECT e.EpisodeID, e.EpisodeNumber, sea.SeasonID, sea.SeasonNumber, ui.Progress, sea.REF_ShowID
            FROM LINKs_User_Interacts_Episode ui
            JOIN Episodes e ON ui.REF_EpisodeID = e.EpisodeID
            JOIN Seasons sea ON e.REF_SeasonID = sea.SeasonID
            WHERE ui.REF_UserID = ? AND sea.REF_ShowID = ? AND ui.isCompleted = 0 AND ui.isDropped = 0
            ORDER BY sea.SeasonNumber DESC, e.EpisodeNumber DESC
            LIMIT 1
        ) AS cw ON cw.REF_ShowID = s.ShowID

        WHERE s.ShowID = ?`;
        
    
    return await db.getAsync(sql, [applang, applang, userId, userId, showId, showId]);
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


/**
 * Droppa completamente uno show dal continue watching.
 * @param {number} userId 
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */
const dropShowFromContinueWatching = async (userId, showId) => {
    const sql = `
        UPDATE LINKs_User_Interacts_Episode 
        SET isDropped = 1 
        WHERE REF_UserID = ? AND REF_EpisodeID IN (
            SELECT e.EpisodeID 
            FROM Episodes e
            JOIN Seasons s ON e.REF_SeasonID = s.SeasonID
            WHERE s.REF_ShowID = ?
        )`;
    return await db.runAsync(sql, [userId, showId]);
};

module.exports = {
    searchShows,
    getShowGenres,
    getFirstEpisodeOfShow,
    getEpisodeSubs,
    getEpisodeAudio,
    getTopStreamed,
    getTopFavorited,
    getShowsWithRecentOpenDiscussions,
    getContinueWatching,
    getShowByIdNoAuth,
    getShowByIdAuth,
    addLikeInteraction,
    removeLikeInteraction,
    incrementFavorites,
    decrementFavorites,
    dropShowFromContinueWatching
};