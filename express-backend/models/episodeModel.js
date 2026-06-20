const db = require("../db/db");

const getEpisodesBySeasonNoAuth = async (seasonId, applang = "it") => {
    const sql = `
        SELECT 
            e.EpisodeID, e.ReleaseDate, e.Duration, e.Likes, e.Streams, e.ThumbnailURI, e.EpisodeNumber,

            -- Aggiunta la virgola sopra e rimossa la virgola prima del FROM
            COALESCE(Title->>?, Title->>'it') AS Title,
            COALESCE(Description->>?, Description->>'it') AS Description
        FROM Episodes AS e
        WHERE REF_SeasonID = ?
        ORDER BY EpisodeNumber ASC`;
    
    // NOTA: Come sopra, servono 3 parametri per riempire i 3 punti interrogativi
    return await db.allAsync(sql, [applang, applang, seasonId]);
}

const getEpisodesBySeasonAuth = async (userId, seasonId, applang = "it") => {
    const sql = `
        SELECT 
            e.EpisodeID, e.ReleaseDate, e.Duration, e.Likes, e.Streams, e.ThumbnailURI, e.EpisodeNumber,
            COALESCE(e.Title->>?, e.Title->>'it') AS Title,
            COALESCE(e.Description->>?, e.Description->>'it') AS Description,
            
            -- CAMPI AGGIUNTI PER IL CONTINUA A GUARDARE E I LIKE
            IFNULL(l.Progress, 0) AS progress, 
            IFNULL(l.isCompleted, 0) AS isCompleted,
            IFNULL(l.isLiked, 0) AS isLiked

        FROM Episodes AS e

        -- LEFT JOIN: Mostra tutti gli episodi, anche se non ci sono interazioni!
        -- ATTENZIONE: Il controllo dell'ID utente DEVE stare nel "ON", non nel "WHERE"
        LEFT JOIN LINKs_User_Interacts_Episode AS l 
            ON e.EpisodeID = l.REF_EpisodeID AND l.REF_UserID = ?

        WHERE e.REF_SeasonID = ?
        ORDER BY e.EpisodeNumber ASC;
    `;

    return await db.allAsync(sql, [applang, applang, userId, seasonId]);
}

/**
 * Trova un episodio nel database usando il suo id
 * @param {number} episodeId 
 * @returns {Promise<Object|null>}
 */

const getEpisodeById = async (episodeId, applang = "it") => {
    const sql = `
        SELECT 
            e.EpisodeID, e.ReleaseDate, e.REF_SeasonID, e.Duration, e.Likes, e.Streams, e.ThumbnailURI, e.EpisodeNumber,
            COALESCE(e.Title->>?, e.Title->>'it') AS Title,
            COALESCE(e.Description->>?, e.Description->>'it') AS Description,
            (SELECT GROUP_CONCAT(REF_LanguageID) FROM EpisodeLanguage WHERE REF_EpisodeID = e.EpisodeID) AS DubLanguages,
            (SELECT GROUP_CONCAT(REF_LanguageID) FROM EpisodeSubtitles WHERE REF_EpisodeID = e.EpisodeID) AS SubLanguages
        FROM Episodes AS e
        WHERE e.EpisodeID = ?`;
        
    return await db.getAsync(sql, [applang, applang, episodeId]);
};

/**
 * Recupera l'intera interazione dell'utente con l'episodio (progress, like, ecc.)
 */
const getUserEpisodeInteraction = async (episodeId, userId) => {
    const sql = `SELECT Progress, isCompleted, isDropped, isLiked 
                 FROM LINKs_User_Interacts_Episode 
                 WHERE REF_EpisodeID = ? AND REF_UserID = ?`;
    return await db.getAsync(sql, [episodeId, userId]);
};


/**
 * Controlla se un utente ha messo o meno like a un episodio in particolare
 * @param {number} episodeId 
 * @param {number} userId 
 * @returns {Promise<Object|null>}
 */

const getPreviousLikeStatus = async (episodeId, userId) => {
    const sql = 'SELECT isLiked FROM LINKs_User_Interacts_Episode WHERE REF_EpisodeID = ? AND REF_UserID = ?';
    return await db.getAsync(sql, [episodeId, userId]);
};

/**
 * Inserisce o, se già presente nel database, aggiorna un'interazione fra utente ed episodio
 * @param {number} userId 
 * @param {number} episodeId 
 * @param {number} progress (<= episode.Duration)
 * @param {number} isCompleted (0 o 1)
 * @param {number} isDropped (0 o 1)
 * @param {number} isLiked (0 o 1)
 * @returns {Promise<{id: number, changes: number}>}
 */

const upsertEpisodeInteraction = async (userId, episodeId, progress, isCompleted, isDropped, isLiked) => {
    const sql = `INSERT INTO LINKs_User_Interacts_Episode
                    (REF_UserID, REF_EpisodeID, LastWatchedDate, Progress, isCompleted, isDropped, isLiked)
                VALUES
                    (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
                ON CONFLICT(REF_UserID, REF_EpisodeID) DO UPDATE SET
                    LastWatchedDate = CURRENT_TIMESTAMP,
                    Progress = excluded.Progress,
                    isCompleted = excluded.isCompleted,
                    isDropped = excluded.isDropped,
                    isLiked = excluded.isLiked`;
                    
    return await db.runAsync(sql, [userId, episodeId, progress, isCompleted, isDropped, isLiked]);
};

/**
 * Se il likeDelta è diverso da zero, aggiorna il numero di like dell'episodio (-1 o +1)
 * @param {number} likeDelta (-1 o 1)
 * @param {number} episodeId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const updateEpisodeLikesCounter = async (likeDelta, episodeId) => {
    const sql = `UPDATE Episodes SET Likes = Likes + ? WHERE EpisodeID = ?`;
    return await db.runAsync(sql, [likeDelta, episodeId]);
};

// Assicurati di avere una tabella SupportedLanguages con (LanguageID, LanguageName)
// Es: ('it', 'Italiano'), ('en', 'English (Original)')

const getEpisodeDubs = async (episodeId) => {
    // Esempio basato su una tabella "EpisodeDubs"
    const sql = `
        SELECT REF_LanguageID
        FROM EpisodeLanguage
        WHERE REF_EpisodeID = ?
    `;
    return await db.allAsync(sql, [episodeId]);
};

const getEpisodeSubs = async (episodeId) => {
    // Esempio basato su una tabella "EpisodeSubs"
    const sql = `
        SELECT REF_LanguageID
        FROM EpisodeSubtitles
        WHERE REF_EpisodeID = ?
    `;
    return await db.allAsync(sql, [episodeId]);
};

// ==========================================
// GET: Recupera i tempi di un episodio
// ==========================================
const getEpisodeTimes = async (episodeId) => {
    const sql = `SELECT "StartTime", "EndTime", "Type" FROM "EpisodeTimes" WHERE "REF_EpisodeID" = ?`;
    return await db.allAsync(sql, [episodeId]);
};

// ==========================================
// SET: Sovrascrive i tempi di un episodio
// ==========================================
const updateEpisodeTimes = async (episodeId, timesArray) => {
    try {
        // 1. Eliminiamo i vecchi tempi per fare piazza pulita
        await db.runAsync(`DELETE FROM "EpisodeTimes" WHERE "REF_EpisodeID" = ?`, [episodeId]);

        // 2. Inseriamo i nuovi tempi (se ce ne sono)
        if (timesArray && timesArray.length > 0) {
            for (const time of timesArray) {
                // time.StartTime e time.EndTime devono essere interi!
                await db.runAsync(
                    `INSERT INTO "EpisodeTimes" ("REF_EpisodeID", "StartTime", "EndTime", "Type") VALUES (?, ?, ?, ?)`,
                    [episodeId, time.StartTime, time.EndTime, time.Type]
                );
            }
        }
        return true;
    } catch (err) {
        console.error("Errore durante l'aggiornamento dei tempi dell'episodio:", err);
        throw err;
    }
};

module.exports = {
    getEpisodesBySeasonAuth,
    getEpisodesBySeasonNoAuth,
    getEpisodeById,
    getUserEpisodeInteraction,
    getPreviousLikeStatus,
    upsertEpisodeInteraction,
    updateEpisodeLikesCounter,
    getEpisodeDubs,
    getEpisodeSubs,
    getEpisodeTimes,
    updateEpisodeTimes
};