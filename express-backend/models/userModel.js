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

const createUser = async (username, email, hashedPassword, languageId, propicId) => {
    const sql = `INSERT INTO Users 
        (Username, Email, Password, isAdmin, isMod, isCataloguer, REF_LanguageID, REF_PropicID) 
        VALUES (?, ?, ?, 0, 0, 0, ?, ?)`;
        
    return await db.runAsync(sql, [username, email, hashedPassword, languageId, propicId]);
};

module.exports = {
    getUserByEmail,
    createUser
};