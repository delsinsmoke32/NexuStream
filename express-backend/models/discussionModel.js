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

module.exports = {
    getDiscussionsByEpisode,
    getDiscussionById
}