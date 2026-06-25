const db = require("../db/db");

/**
 * Ottiene la lista dei commenti per una determinata discussione
 * @param {number} discussionId 
 * @param {number} userId
 * @returns {Promise<Array<Object>>}
 */

const getCommentsByDiscussion = async (discussionId, userId) => {
    // 🚀 Aggiunta la JOIN con le interazioni dell'utente per sapere se HA GIÀ messo like o segnalato!
    let sql = `SELECT c.*, u.Username, u.REF_PropicURI, u.isAdmin, u.isMod, u.isCataloguer,
                      COALESCE(i.isLiked, 0) AS isLiked,
                      COALESCE(i.isReported, 0) AS isReported
               FROM Comments c
               LEFT JOIN Users AS u ON c.REF_UserID = u.UserID
               LEFT JOIN LINKs_User_Interacts_Comment i ON c.CommentID = i.REF_CommentID AND i.REF_UserID = ?
               WHERE c.REF_DiscussionID = ?`;

    sql += ` ORDER BY c.DateCommented DESC`;
    
    // Passiamo prima l'userId per la JOIN, e poi il discussionId per la WHERE
    return await db.allAsync(sql, [userId || null, discussionId]);
};

/**
 * Aggiorna i contatori totali di Like e Report di un commento
 */
const updateCommentStats = async (commentId, likeDelta, reportDelta) => {
    const sql = `UPDATE Comments 
                 SET Likes = Likes + ?, ReportCount = ReportCount + ? 
                 WHERE CommentID = ?`;
    return await db.runAsync(sql, [likeDelta, reportDelta, commentId]);
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
    const sql = `INSERT INTO Comments (REF_CommentID, REF_UserID, REF_DiscussionID, CommentText, isHidden, Likes, isApproved, ReportCount)
                 VALUES (?, ?, ?, ?, 0, 0, 0, 0)`;
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
    updateApprovalStatus,
    updateCommentStats
};