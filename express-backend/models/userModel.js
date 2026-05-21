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
 * Crea un utente e lo inserisce nel database con le nuove preferenze multilingua e avatar
 * @param {string} username 
 * @param {string} email 
 * @param {string} hashedPassword 
 * @param {string} audioLang - Lingua audio predefinita (es. 'it')
 * @param {string} textLang  - Lingua sottotitoli predefinita (es. 'it')
 * @param {string} appLang   - Lingua dell'interfaccia dell'app (es. 'it')
 * @param {string} propicURI - Percorso dell'immagine di profilo (es. '/static/avatars/avatar-001.png')
 * @returns {Promise<{id: number, changes: number}>}
 */

const createUser = async (username, email, hashedPassword, audioLang = 'it', textLang = 'it', appLang = 'it', propicURI = '/static/avatars/avatar-001.png') => {
    const sql = `INSERT INTO Users 
        (Username, Email, Password, isAdmin, isMod, isCataloguer, REF_Audio_Language, REF_Text_Language, REF_App_Language, REF_PropicURI, canComment) 
        VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, ?, 1)`;
        
    return await db.runAsync(sql, [username, email, hashedPassword, audioLang, textLang, appLang, propicURI]);
};

/**
 * Recupera i dati del profilo completo e amministrativo di un utente tramite il suo ID
 * @param {number} userId 
 * @returns {Promise<Object|null>}
 */
const getUserProfileById = async (userId) => {
    const sql = `SELECT 
                    UserID, 
                    Username, 
                    Email, 
                    isAdmin, 
                    isMod, 
                    isCataloguer, 
                    REF_Audio_Language, 
                    REF_Text_Language, 
                    REF_App_Language, 
                    REF_PropicURI, 
                    canComment 
                 FROM Users 
                 WHERE UserID = ?`;
    return await db.getAsync(sql, [userId]);
};

module.exports = {
    getUserByEmail,
    createUser,
    getUserProfileById
};