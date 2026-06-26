const db = require("../db/db");

//-----------------------
// GESTIONE DISCUSSIONI
//-----------------------

// GET - Prende discussioni in base al nome dell'episodio, se viene passato, altrimenti tutte dalle più recenti
const getDiscussions = async (showClosed, search) => {
    let sql = `SELECT d.*, e.EpisodeNumber, e.Title AS EpisodeTitle, s.SeasonNumber, sh.Title AS ShowTitle 
               FROM Discussions AS d
               JOIN Episodes AS e ON d.REF_EpisodeID = e.EpisodeID
               JOIN Seasons AS s ON e.REF_SeasonID = s.SeasonID
               JOIN Shows AS sh ON s.REF_ShowID = sh.ShowID
               WHERE 1=1`;
    
    const params = [];

    
    if (!showClosed || showClosed === 0 || showClosed === '0') {
        sql += ` AND (d.CloseDate IS NULL OR datetime('now', 'localtime') < d.CloseDate) AND d.ForceClosed = 0`;
    } else {
        
        sql += ` AND (d.CloseDate <= datetime('now', 'localtime') OR d.ForceClosed = 1)`;
    }

    
    if (search) {
        sql += ` AND (e.Title LIKE ? OR sh.Title LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

   
    sql += ` ORDER BY d.OpenDate DESC`;

    return await db.allAsync(sql, params);
};

// POST - Inserisce una nuova discussione attiva (ForceClosed = 0 di default)
const createDiscussion = async ({ REF_EpisodeID, openDate, closeDate, type }) => {
    const sql = `INSERT INTO Discussions (REF_EpisodeID, OpenDate, CloseDate, ForceClosed, Type)
                 VALUES (?, ?, ?, 0, ?)`;
    return await db.runAsync(sql, [REF_EpisodeID, openDate, closeDate, type]);
};

// PATCH - Costruisce dinamicamente la query di aggiornamento
const updateDiscussion = async (discussionId, fields) => {
    const assignments = [];
    const params = [];

    if (fields.closeDate !== undefined) {
        assignments.push(`CloseDate = ?`);
        params.push(fields.closeDate);
    }

    if (fields.forceClosed !== undefined) {
        assignments.push(`ForceClosed = ?`);
        params.push(fields.forceClosed);
    }

    if (fields.type !== undefined) {
        assignments.push(`Type = ?`);
        params.push(fields.type);
    }

    // Se non è stato passato alcun campo valido, usciamo senza fare query
    if (assignments.length === 0) return 0;

    const sql = `UPDATE Discussions SET ${assignments.join(', ')} WHERE DiscussionID = ?`;
    params.push(discussionId);

    const result = await db.runAsync(sql, params);
    return result.changes; // Restituisce il numero di righe modificate (0 se l'ID non esiste)
};

// DELETE - Rimuove il record
const deleteDiscussion = async (discussionId) => {
    const sql = `DELETE FROM Discussions WHERE DiscussionID = ?`;
    const result = await db.runAsync(sql, [discussionId]);
    return result.changes; 
};

//-----------------------
// GESTIONE UTENTI
//-----------------------

/**
 * Recupera lo stato dei ruoli di un utente target per verificare se è un membro dello staff.
 * @param {number} userId - L'ID dell'utente da controllare.
 * @returns {Promise<Object|undefined>} Ruoli dell'utente o undefined se non esiste.
 */

const getTargetUserStatus = async (userId) => {
    const sql = `SELECT UserID, isAdmin, isMod, isCataloguer, canComment FROM Users WHERE UserID = ?`;
    return await db.getAsync(sql, [userId]);
};

const filterUsers = async (search, offset, limit) => {
    let sql = `
        SELECT u.UserID, u.Username, u.Email, u.REF_PropicURI, u.canComment, u.BannedUntil
        FROM Users AS u
        WHERE u.isMod = 0 AND u.isCataloguer = 0 AND u.isAdmin = 0`;
    
    const params = [];

    if (search) {
        sql += ` AND (u.Username LIKE ? OR u.Email LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
    }

    sql += ` ORDER BY u.Username ASC
            LIMIT ?
            OFFSET ?`;

    params.push(limit, offset);

    return await db.allAsync(sql, params);
};

const getUserCommentsById = async (userId) => {
    let sql = `SELECT c.*
               FROM Comments AS c
               WHERE c.REF_UserID = ?
               ORDER BY c.ReportCount DESC, c.DateCommented DESC`;
    
    return await db.allAsync(sql, [userId]);
}



//----------------
// GESTIONE BAN
//----------------

/**
 * Applica una restrizione di commento (ban) a un determinato utente sul database.
 * @param {number} userId - L'ID dell'utente da sanzionare.
 * @param {string|null} bannedUntil - Stringa della data in formato ISO (scadenza), oppure null per un ban permanente.
 * @returns {Promise<Object>} Risultato dell'operazione di UPDATE.
 */

const banUser = async (userId, bannedUntil) => {
    const sql = `UPDATE Users 
                 SET canComment = 0, BannedUntil = ? 
                 WHERE UserID = ?`;
    return await db.runAsync(sql, [bannedUntil, userId]);
};

/**
 * Rimuove la restrizione di commento (sbanna) ripristinando i permessi di un utente.
 * @param {number} userId - L'ID dell'utente da riabilitare.
 * @returns {Promise<Object>} Risultato dell'operazione di UPDATE.
 */

const unbanUser = async (userId) => {
    const sql = `UPDATE Users 
                 SET canComment = 1, BannedUntil = NULL 
                 WHERE UserID = ?`;
    return await db.runAsync(sql, [userId]);
};

module.exports = {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    filterUsers,
    getUserCommentsById,
    getTargetUserStatus,
    banUser,
    unbanUser
};