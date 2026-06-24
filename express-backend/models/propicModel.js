const db = require("../db/db");

/**
 * Recupera tutte le propic del db
 * @returns {Promise<Array<Object>>}
 */

const getAllPropics = async () => {
    const sql = `SELECT Bundle, PropicURI
                 FROM Propics
                 WHERE 1=1
                 ORDER BY Bundle ASC`;
    return await db.allAsync(sql);
}

module.exports = {
    getAllPropics
}