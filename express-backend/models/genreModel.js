const db = require("../db/db");

/**
 * Recupera tutti i generi del db
 * @returns {Promise<Array<Object>>}
 */

const getGenres = async () => {
    const sql = `SELECT GenreID, Name
                 FROM Genres
                 WHERE 1=1
                 ORDER BY Name ASC`;
    return await db.allAsync(sql);
}

module.exports = {
    getGenres
}