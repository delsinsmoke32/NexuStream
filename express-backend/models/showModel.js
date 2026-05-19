const db = require("../db/db");

/**
 * Cerca gli show in base al titolo o alla descrizione, calcolando un punteggio di rilevanza
 * @param {string} queryParam - Il termine di ricerca formattato con i % (es. "%breaking%")
 * @returns {Promise<Array<Object>>}
 */

const searchShows = async (queryParam) => {
    const sql = `SELECT *,
       (CASE WHEN s.Title LIKE ? THEN 10 ELSE 0 END +
        CASE WHEN s.Description LIKE ? THEN 1 ELSE 0 END) AS RelevanceScore
        FROM Shows AS s WHERE s.Title LIKE ? OR s.Description LIKE ?
        ORDER BY RelevanceScore DESC, s.Title ASC`;

    // Passiamo lo stesso parametro 4 volte per i 4 punti di domanda della query
    return await db.allAsync(sql, [queryParam, queryParam, queryParam, queryParam]);
};

/**
 * Prende le 20 serie con più favorites
 * @returns {Promise<Array<Object>>}
 */

const getTopFavorited = async () => {
    const sql = `
        SELECT *
        FROM Shows AS s
        ORDER BY s.Favourited DESC
        LIMIT 20`;
    return await db.allAsync(sql, []);
};

/**
 * Prende le 20 serie con più stream
 * @returns {Promise<Array<Object>>}
 */

const getTopStreamed = async () => {
    const sql = `
        SELECT sh.*, SUM(e.Streams) AS TotalStreams
        FROM Shows AS sh
        JOIN Seasons AS s ON s.REF_ShowID = sh.ShowID
        JOIN Episodes AS e ON e.REF_SeasonID = s.SeasonID
        GROUP BY sh.ShowID
        ORDER BY TotalStreams DESC
        LIMIT 20`;
    return await db.allAsync(sql, []);
};

/**
 * Prende i 10 episodi più recenti che l'utente non ha finito di guardare, oltre a informazioni relative alle rispettive serie e stagioni
 * @param {number} userId 
 * @returns {Promise<Array<Object>>}
 */

const getContinueWatching = async (userId) => {
    const sql = `
        SELECT sh.showID, sh.Title AS ShowTitle, s.Description,
            e.EpisodeID, e.Title AS EpisodeTitle,
            ui.Progress, ui.LastWatchedDate
        FROM LINKs_User_Interacts_Episode AS ui
        JOIN Episodes AS e ON ui.REF_EpisodeID = e.EpisodeID
        JOIN Seasons AS s ON e.REF_SeasonID = s.SeasonID
        JOIN Shows AS sh ON s.REF_ShowID = sh.ShowID
        WHERE ui.REF_UserID = ? AND ui.isCompleted = 0 AND ui.isDropped = 0
        ORDER BY ui.LastWatchedDate DESC
        LIMIT 10`;
    return await db.allAsync(sql, [userId]);
};

/**
 * Trova uno show in base al suo id
 * @param {number} showId 
 * @returns {Promise<Object|null>}
 */

const getShowById = async (showId) => {
    const sql = `SELECT * FROM Shows WHERE ShowID = ?`;
    return await db.getAsync(sql, [showId]);
};

/**
 * Trova un'interazione di favorite fra utente e show basandosi sui rispettivi id
 * @param {number} userId 
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const addLikeInteraction = async (userId, showId) => {
    const sql = `INSERT OR IGNORE INTO LINKs_User_Likes_Show(REF_UserID, REF_ShowID) VALUES (?, ?)`;
    return await db.runAsync(sql, [userId, showId]);
};

/**
 * Rimuove un'interazione di favorite fra utente e show basandosi sui rispettivi id
 * @param {number} userId 
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const removeLikeInteraction = async (userId, showId) => {
    const sql = `DELETE FROM LINKs_User_Likes_Show WHERE REF_UserID = ? AND REF_ShowID = ?`;
    return await db.runAsync(sql, [userId, showId]);
};

/**
 * Incrementa il contatore dei favorite di una serie
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const incrementFavorites = async (showId) => {
    const sql = `UPDATE Shows SET Favourited = Favourited + 1 WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

/**
 * Decrementa il contatore dei favorite di una serie
 * @param {number} showId 
 * @returns {Promise<{id: number, changes: number}>}
 */

const decrementFavorites = async (showId) => {
    const sql = `UPDATE Shows SET Favourited = Favourited - 1 WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

module.exports = {
    searchShows,
    getTopStreamed,
    getTopFavorited,
    getContinueWatching,
    getShowById,
    addLikeInteraction,
    removeLikeInteraction,
    incrementFavorites,
    decrementFavorites
};