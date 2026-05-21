const db = require("../db/db");

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

module.exports = {
    getEpisodeById,
    getPreviousLikeStatus,
    upsertEpisodeInteraction,
    updateEpisodeLikesCounter
};