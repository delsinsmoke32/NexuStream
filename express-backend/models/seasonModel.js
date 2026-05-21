const db = require("../db/db");

/**
 * Recupera i dettagli di una singola stagione tramite il suo ID, localizzando titolo e descrizione
 * @param {number} seasonId 
 * @param {string} applang - La lingua dell'interfaccia utente (es. "en")
 * @returns {Promise<Object|null>} L'oggetto stagione localizzato o null
 */
const getSeasonById = async (seasonId, applang = 'it') => {
    const sql = `
        SELECT SeasonID, REF_ShowID, DateStarted, hasEnded, DateEnded, SeasonNumber,
            -- Estraiamo il titolo e la descrizione in base alla lingua richiesta (default 'it')
            COALESCE(Title->>?, Title->>'it') AS Title,
            COALESCE(Description->>?, Description->>'it') AS Description
        FROM Seasons 
        WHERE SeasonID = ?`;
        
    return await db.getAsync(sql, [applang, applang, seasonId]);
};

module.exports = {
    getSeasonById
};