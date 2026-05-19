const db = require("../db/db");

/**
 * Cerca un utente nel database tramite la sua email
 * @param {string} email 
 * @returns {Promise<Object|null>} L'oggetto utente o null
 */

const getUserByEmail = async (email) => {
    const sql = `SELECT * FROM Users WHERE Email = ?`;
    return await db.getAsync(sql, [email]);
};

/**
 * Crea un utente e lo inserisce nel database
 * @param {string} username 
 * @param {string} email 
 * @param {string} hashedPassword 
 * @param {string} languageId 
 * @param {string} propicId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const createUser = async (username, email, hashedPassword, languageId, propicId) => {
    const sql = `INSERT INTO Users 
        (Username, Email, Password, isAdmin, isMod, isCataloguer, REF_LanguageID, REF_PropicID) 
        VALUES (?, ?, ?, 0, 0, 0, ?, ?)`;
        
    return await db.runAsync(sql, [username, email, hashedPassword, languageId, propicId]);
};

/**
 * Recupera i dati del profilo pubblico/amministrativo di un utente tramite il suo ID
 * @param {number} userId 
 * @returns {Promise<Object|null>}
 */

const getUserProfileById = async (userId) => {
    const sql = `SELECT UserID, Username, Email, isAdmin, isMod, isCataloguer FROM Users WHERE UserID = ?`;
    return await db.getAsync(sql, [userId]);
};

module.exports = {
    getUserByEmail,
    createUser,
    getUserProfileById
};