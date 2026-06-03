const db = require("../db/db");

const getSeasonsByShow = async (showId, applang = "it") => {
    const sql = `
        SELECT 
            SeasonID, DateStarted, hasEnded, DateEnded, SeasonNumber,
            -- Aggiunto il Titolo e la Descrizione estratti dal JSON
            COALESCE(Title->>?, Title->>'it') AS Title,
            COALESCE(Description->>?, Description->>'it') AS Description
        FROM Seasons
        WHERE REF_ShowID = ?
        ORDER BY SeasonNumber ASC`;
    
    // NOTA: Passiamo applang 2 volte per i due punti interrogativi, e infine lo showId
    return await db.allAsync(sql, [applang, applang, showId]);
}

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
    getSeasonById,
    getSeasonsByShow
};