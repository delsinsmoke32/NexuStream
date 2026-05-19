const db = require("../db/db");

/**
 * Recupera i dettagli di un episodio includendo le lingue di doppiaggio e sottotitoli concatenate
 */

const getEpisodeById = async (episodeId) => {
    const sql = `SELECT e.*,
            (SELECT GROUP_CONCAT(Language) FROM EpisodeLanguage AS el WHERE e.EpisodeID = el.REF_EpisodeID) AS DubLanguages,
            (SELECT GROUP_CONCAT(Language) FROM EpisodeSub AS es WHERE e.EpisodeID = es.REF_EpisodeID) AS SubLanguages
            FROM Episodes AS e WHERE e.EpisodeID = ?`;
    return await db.getAsync(sql, [episodeId]);
};

/**
 * Recupera lo stato del 'Like' precedente di un utente su un episodio
 */

const getPreviousLikeStatus = async (episodeId, userId) => {
    const sql = 'SELECT isLiked FROM LINKs_User_Interacts_Episode WHERE REF_EpisodeID = ? AND REF_UserID = ?';
    return await db.getAsync(sql, [episodeId, userId]);
};

/**
 * Inserisce o aggiorna l'interazione dell'utente con l'episodio (Upsert)
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
 * Aggiorna il contatore dei Mi Piace di un episodio in base al delta calcolato
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