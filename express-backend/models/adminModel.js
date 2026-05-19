const db = require("../db/db");

/**
 * Cerca gli utenti nel database applicando filtri dinamici di testo e di ruolo
 * @param {string|null} search - Testo da cercare in username o email
 * @param {string|null} role - Ruolo specifico ('mod', 'cataloguer', 'admin')
 * @returns {Promise<Array<Object>>} Array degli utenti trovati (anche vuoto)
 */

const filterUsers = async (search, role) => {
    let sql = `
        SELECT u.UserID, u.Username, u.Email, u.isMod, u.isCataloguer, u.isAdmin, u.REF_PropicID
        FROM Users AS u
        WHERE 1=1`;
    
    const params = [];

    if (search) {
        sql += ` AND (u.Username LIKE ? OR u.Email LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
    }

    if (role) {
        if (role === 'mod') sql += ' AND u.isMod = 1';
        if (role === 'cataloguer') sql += ' AND u.isCataloguer = 1';
        if (role === 'admin') sql += ' AND u.isAdmin = 1';
    }

    sql += ' ORDER BY u.Username ASC';

    return await db.allAsync(sql, params);
};

/**
 * Aggiorna i ruoli di un utente specifico in modo dinamico
 * @param {number} userId 
 * @param {number|undefined} isMod 
 * @param {number|undefined} isCataloguer 
 * @returns {Promise<{id: number, changes: number}>} Oggetto con id e changes di db.runAsync
 */

const updateUserRoles = async (userId, isMod, isCataloguer) => {
    let updateFields = [];
    let params = [];

    if (isMod !== undefined) {
        updateFields.push(`isMod = ?`);
        params.push(isMod ? 1 : 0);
    }
    if (isCataloguer !== undefined) {
        updateFields.push('isCataloguer = ?');
        params.push(isCataloguer ? 1 : 0);
    }

    params.push(userId);

    const sql = `UPDATE Users SET ${updateFields.join(', ')} WHERE UserID = ?`;
    return await db.runAsync(sql, params);
};

module.exports = {
    filterUsers,
    updateUserRoles
};