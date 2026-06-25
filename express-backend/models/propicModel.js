const db = require("../db/db");
const { check } = require("express-validator");

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

// TODO DOCS

const checkPropic = async(propicURI) => {
    const sql = `SELECT 1
                 FROM Propics
                 WHERE Propic = ?`
    return await db.getAsync(sql, [propicURI])
}

module.exports = {
    getAllPropics,
    checkPropic
}