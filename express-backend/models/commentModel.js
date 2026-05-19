const db = require("../db/db");

/**
 * Ottiene la lista dei commenti per un determinato episodio
 * @param {number} episodeId 
 * @param {boolean} isMod - Se true include anche i commenti nascosti
 * @returns {Promise<Array<Object>>}
 */

const getCommentsByEpisode = async (episodeId, isMod) => {
    let sql = `SELECT c.*, u.Username, u.isAdmin, u.isMod
               FROM Comments c
               JOIN Users AS u ON c.REF_UserID = u.UserID
               WHERE c.REF_EpisodeID = ?`;

    if (!isMod) {
        sql += ` AND c.isHidden = 0`;
    }

    sql += ` ORDER BY c.DateCommented DESC`;
    return await db.allAsync(sql, [episodeId]);
};

/**
 * Inserisce un nuovo commento o una risposta nel database
 */

const createComment = async (parentCommentId, userId, episodeId, text) => {
    const sql = `INSERT INTO Comments (REF_CommentID, REF_UserID, REF_EpisodeID, CommentText, isHidden, Likes, isApproved)
                 VALUES (?, ?, ?, ?, 0, 0, 0)`;
    return await db.runAsync(sql, [parentCommentId || null, userId, episodeId, text]);
};

/**
 * Recupera l'interazione precedente di un utente su un commento
 */

const getCommentInteraction = async (userId, commentId) => {
    const sql = `SELECT isLiked, isReported FROM LINKs_User_Interacts_Comment WHERE REF_UserID = ? AND REF_CommentID = ?`;
    return await db.getAsync(sql, [userId, commentId]);
};

/**
 * Registra o aggiorna l'interazione di un utente (Like/Report) su un commento
 */

const upsertCommentInteraction = async (commentId, userId, isLiked, isReported) => {
    const sql = `INSERT INTO LINKs_User_Interacts_Comment (REF_CommentID, REF_UserID, isLiked, isReported)
                 VALUES (?, ?, ?, ?) ON CONFLICT(REF_CommentID, REF_UserID) DO UPDATE SET
                 isLiked = excluded.isLiked,
                 isReported = excluded.isReported`;
    return await db.runAsync(sql, [commentId, userId, isLiked, isReported]);
};

/**
 * Cambia lo stato di visibilità (nascondi/mostra) di un commento
 */

const updateHiddenStatus = async (commentId, isHidden) => {
    const sql = `UPDATE Comments SET isHidden = ? WHERE CommentID = ?`;
    return await db.runAsync(sql, [isHidden, commentId]);
};

/**
 * Cambia lo stato di approvazione di un commento
 */

const updateApprovalStatus = async (commentId, isApproved) => {
    const sql = `UPDATE Comments SET isApproved = ? WHERE CommentID = ?`;
    return await db.runAsync(sql, [isApproved, commentId]);
};

module.exports = {
    getCommentsByEpisode,
    createComment,
    getCommentInteraction,
    upsertCommentInteraction,
    updateHiddenStatus,
    updateApprovalStatus
};