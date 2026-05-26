const db = require("../db/db");

/**
 * Ottiene la lista dei commenti per una determinata discussione
 * @param {number} discussionId 
 * @param {boolean} isMod (0 o 1)
 * @returns {Promise<Array<Object>>}
 */

const getCommentsByDiscussion = async (discussionId, isMod) => {
    let sql = `SELECT c.*, u.Username, u.isAdmin, u.isMod, u.isCataloguer
               FROM Comments c
               JOIN Users AS u ON c.REF_UserID = u.UserID
               WHERE c.REF_DiscussionID = ?`;

    if (!isMod) {
        sql += ` AND c.isHidden = 0`;
    }

    sql += ` ORDER BY c.DateCommented DESC`;
    return await db.allAsync(sql, [discussionId]);
};

/**
 * Crea un commento e lo aggiunge al database
 * @param {number} parentCommentId 
 * @param {number} userId 
 * @param {number} discussionId 
 * @param {string} text 
 * @returns {Promise<{id: number, changes: number}>}
 */

const createComment = async (parentCommentId, userId, discussionId, text) => {
    const sql = `INSERT INTO Comments (REF_CommentID, REF_UserID, REF_DiscussionID, CommentText, isHidden, Likes, isApproved)
                 VALUES (?, ?, ?, ?, 0, 0, 0)`;
    return await db.runAsync(sql, [parentCommentId || null, userId, discussionId, text]);
};

/**
 * Controlla se ha un utente ha messo like o reportato un commento
 * @param {number} userId 
 * @param {number} commentId 
 * @returns {Promise<Object|null>}
 */

const getCommentInteraction = async (userId, commentId) => {
    const sql = `SELECT isLiked, isReported FROM LINKs_User_Interacts_Comment WHERE REF_UserID = ? AND REF_CommentID = ?`;
    return await db.getAsync(sql, [userId, commentId]);
};

/**
 * Inserisce o, se già presente nel database, aggiorna un'interazione fra utente e commento
 * @param {number} commentId 
 * @param {number} userId 
 * @param {number} isLiked (0 o 1)
 * @param {number} isReported (0 o 1)
 * @returns {Promise<{id: number, changes: number}>}
 */

const upsertCommentInteraction = async (commentId, userId, isLiked, isReported) => {
    const sql = `INSERT INTO LINKs_User_Interacts_Comment (REF_CommentID, REF_UserID, isLiked, isReported)
                 VALUES (?, ?, ?, ?) ON CONFLICT(REF_CommentID, REF_UserID) DO UPDATE SET
                 isLiked = excluded.isLiked,
                 isReported = excluded.isReported`;
    return await db.runAsync(sql, [commentId, userId, isLiked, isReported]);
};

/**
 * Nasconde o mostra un commento
 * @param {number} commentId 
 * @param {number} isHidden (0 o 1)
 * @returns {Promise<{id: number, changes: number}>}
 */

const updateHiddenStatus = async (commentId, isHidden) => {
    const sql = `UPDATE Comments SET isHidden = ? WHERE CommentID = ?`;
    return await db.runAsync(sql, [isHidden, commentId]);
};

/**
 * Approva o disapprova un commento
 * @param {number} commentId 
 * @param {number} isApproved (0 o 1) 
 * @returns {Promise<{id: number, changes: number}>}
 */

const updateApprovalStatus = async (commentId, isApproved) => {
    const sql = `UPDATE Comments SET isApproved = ? WHERE CommentID = ?`;
    return await db.runAsync(sql, [isApproved, commentId]);
};

module.exports = {
    getCommentsByDiscussion,
    createComment,
    getCommentInteraction,
    upsertCommentInteraction,
    updateHiddenStatus,
    updateApprovalStatus
};