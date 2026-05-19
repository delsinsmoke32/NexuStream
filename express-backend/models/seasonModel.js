const db = require("../db/db");

/**
 * Recupera i dettagli di una singola stagione tramite il suo ID
 * @param {number} seasonId 
 * @returns {Promise<Object|null>}
 */

const getSeasonById = async (seasonId) => {
    const sql = `SELECT * FROM Seasons WHERE SeasonID = ?`;
    return await db.getAsync(sql, [seasonId]);
};

module.exports = {
    getSeasonById
};