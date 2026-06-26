const db = require("../db/db");

const getDiscussionsByEpisode = async (episodeId) => {
    let sql = `SELECT *
               FROM Discussions
               WHERE REF_EpisodeID = ?`;

    return await db.allAsync(sql, [episodeId]);
};

const getDiscussionById = async (discussionId) => {
    let sql = `SELECT *
               FROM Discussions
               WHERE DiscussionID = ?`;
    
    return await db.getAsync(sql, [discussionId]);
}

// Controlla se una discussione è chiusa
const getDiscussionStatus = async (discussionId) => {
    let sql = `SELECT ForceClosed, CloseDate 
               FROM Discussions 
               WHERE DiscussionID = ?`;
    return await db.getAsync(sql, [discussionId]);
};

// Crea in automatico una discussione standard all'aggiunta di un ep
const autoCreateEpisodeDiscussion = async (episodeId) => {
    let sql = `INSERT INTO Discussions (REF_EpisodeID, OpenDate, CloseDate, ForceClosed, Type)
               VALUES (?, datetime('now', 'localtime'), datetime('now', 'localtime', '+14 days'), 0, 'standard')`;
    return await db.runAsync(sql, [episodeId]);
};

// Crea in automatico una discussione di fine serie per ogni episodio di una stagione finita
const autoCreateSeasonDiscussions = async (seasonId) => {
    // Inserisce in batch una discussione da 2 settimane per ogni episodio della stagione
    let sql = `
        INSERT INTO Discussions (REF_EpisodeID, OpenDate, CloseDate, ForceClosed, Type)
        SELECT e.EpisodeID, datetime('now', 'localtime'), datetime('now', 'localtime', '+1 month'), 0, 'post-season'
        FROM Episodes e
        LEFT JOIN Discussions d ON e.EpisodeID = d.REF_EpisodeID AND d.Type = 'post-season'
        WHERE e.REF_SeasonID = ? AND d.DiscussionID IS NULL
    `;
    return await db.runAsync(sql, [seasonId]);
};

module.exports = {
    getDiscussionsByEpisode,
    getDiscussionById,
    getDiscussionStatus,
    autoCreateEpisodeDiscussion,
    autoCreateSeasonDiscussions
}