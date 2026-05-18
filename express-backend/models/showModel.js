const db = require("../db/db");

/**
 * Cerca gli show in base al titolo o alla descrizione, calcolando un punteggio di rilevanza
 * @param {string} queryParam - Il termine di ricerca formattato con i % (es. "%breaking%")
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
 * Recupera i 20 show con più preferiti
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
 * Calcola i 20 show più visti sommando le riproduzioni di tutti gli episodi
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
 * Recupera la lista degli episodi lasciati a metà da un utente specifico
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

module.exports = {
    searchShows,
    getTopStreamed,
    getTopFavorited,
    getContinueWatching
};