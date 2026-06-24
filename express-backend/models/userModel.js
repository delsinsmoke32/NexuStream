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
/**
 * Salva un token di ripristino password nel database, associandolo a un utente specifico.
 * Il token viene memorizzato con una validità temporale limitata a 15 minuti.
 * @param {number} userId - L'ID univoco dell'utente che ha richiesto il ripristino della password.
 * @param {string} token - Il token alfanumerico univoco crittografato generato per il reset.
 * @returns {Promise<Object>} Una Promise che si risolve con l'oggetto di risultato del database (es. contenente lastID e changes).
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const saveResetToken = async (userId, token) => {
    let sql = `INSERT INTO PasswordResets (REF_UserID, Token, ExpiresAt)
               VALUES (?, ?, datetime('now', '+15 minutes'))`
    
    return await db.runAsync(sql, [userId, token]);
}

/**
 * Verifica se un token di ripristino è presente nel database ed è ancora all'interno del suo ciclo di validità.
 * Controlla che la data di scadenza sia successiva all'orario attuale del server.
 * @param {string} token - Il token alfanumerico da convalidare.
 * @returns {Promise<Object|undefined>} Una Promise che si risolve con un oggetto contenente l'ID utente `{ REF_UserID: number }` se il token è valido, oppure `undefined` se il token è inesistente o scaduto.
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const validateResetToken = async (token) => {
    let sql = `SELECT REF_UserID FROM PasswordResets
               WHERE Token = ? AND ExpiresAt > datetime('now')`;
            
    return await db.getAsync(sql, [token]);
}

/**
 * Aggiorna la password di un determinato utente nel database sostituendola con il nuovo hash calcolato.
 * @param {number} userId - L'ID univoco dell'utente di cui aggiornare le credenziali.
 * @param {string} hashedPassword - Il nuovo hash sicuro della password (generato preventivamente con bcrypt).
 * @returns {Promise<Object>} Una Promise che si risolve con l'oggetto di stato del database (es. verifica delle righe modificate tramite `changes`).
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const updatePassword = async (userId, hashedPassword) => {
    const sql = `UPDATE Users SET Password = ? WHERE UserID = ?`;

    return await db.runAsync(sql, [hashedPassword, userId]);
}

/**
 * Rimuove in modo permanente un token di ripristino dalla tabella d'appoggio per invalidarlo.
 * Questo metodo viene invocato subito dopo un cambio password andato a buon fine per impedire il riutilizzo del link.
 * @param {string} token - Il token alfanumerico da eliminare dal database.
 * @returns {Promise<Object>} Una Promise che si risolve con l'oggetto di stato della cancellazione sul database.
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const deleteResetToken = async (token) => {
    const sql = `DELETE FROM PasswordResets WHERE Token = ?`;

    return await db.runAsync(sql, [token]);
}


const getUserFavorites = async (userId, applang = "it") => {
    const sql = `SELECT s.ShowID, s.ThumbnailURI,
                COALESCE(s.Title->>?, s.Title->>'it') AS Title,
                COALESCE(s.Description->>?, s.Description->>'it') AS Description
                FROM LINKs_User_Likes_Show AS l
                JOIN Shows AS s ON l.REF_ShowID = s.ShowID
                WHERE l.REF_UserID = ?
                ORDER BY Title ASC`;
    
    return await db.allAsync(sql, [applang, applang, userId]);
}

/**
 * Ottiene la password di un determinato utente nel database.
 * @param {number} userId - L'ID univoco dell'utente di cui ottenere la password.
 * @returns {Promise<Object>} Una Promise che si risolve con l'oggetto di stato del database (es. verifica delle righe modificate tramite `changes`).
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const getUserPassword = async (userId) => {
    const sql = `SELECT password FROM Users WHERE UserID = ?`;

    return await db.getAsync(sql, [userId]);
}

/**
 * Modifica la propic di un utente, se la propic desiderata esiste
 * @param {number} userId - L'ID univoco dell'utente di cui aggiornare la propic.
 * @param {string} propicURI - L'URI della nuova propic.
 * @returns {Promise<Object>} Una Promise che si risolve con l'oggetto di stato del database (es. verifica delle righe modificate tramite `changes`).
 * @throws {Error} Se si verifica un errore durante l'esecuzione della query SQL.
 */
const changePropic = async (userId, propicURI) => {
    const sql = `UPDATE Users SET REF_PropicURI = ? WHERE UserID = ?`;

    return await db.runAsync(sql, [propicURI, userId]);
}

module.exports = {
    getUserByEmail,
    createUser,
    getUserProfileById,
    saveResetToken,
    validateResetToken,
    updatePassword,
    deleteResetToken,
    getUserFavorites,
    getUserPassword,
    changePropic
};