const db = require("../db/db");

// GET - Preesistente
const getDiscussions = async (showClosed) => {
    let sql = `SELECT d.*, e.EpisodeNumber, e.Title AS EpisodeTitle, s.SeasonNumber, sh.Title AS ShowTitle 
               FROM Discussions AS d
               JOIN Episodes AS e ON d.REF_EpisodeID = e.EpisodeID
               JOIN Seasons AS s ON e.REF_SeasonID = s.SeasonID
               JOIN Shows AS sh ON s.REF_ShowID = sh.ShowID
               WHERE 1=1`;
    if (!showClosed || showClosed === 0 || showClosed === '0') {
        sql += ` AND datetime('now', 'localtime') < CloseDate AND ForceClosed = 0`;
    }
    return await db.allAsync(sql);
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
    return result.changes; // Grazie a ON DELETE CASCADE, SQLite pulirà da solo la tabella Comments!
};

module.exports = {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion
};