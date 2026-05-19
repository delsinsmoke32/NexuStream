const db = require("../db/db");

// ==========================================
// RECUPERO DATI
// ==========================================
const getAllShows = async (search) => {
    let sql = `SELECT ShowID, Title, Description, DateStarted, DateEnded, hasEnded FROM Shows WHERE 1=1`;
    const params = [];
    if (search) {
        sql += ` AND Title LIKE ?`;
        params.push(`%${search}%`);
    }
    sql += ` ORDER BY Title ASC`;
    return await db.allAsync(sql, params);
};

const getAllSeasons = async (refShow) => {
    let sql = `SELECT SeasonID, Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID FROM Seasons WHERE 1=1`;
    const params = [];
    if (refShow) {
        sql += ` AND REF_ShowID = ?`;
        params.push(refShow);
    }
    sql += ` ORDER BY SeasonID ASC`;
    return await db.allAsync(sql, params);
};

const getAllEpisodes = async (refSeason) => {
    let sql = `SELECT EpisodeID, Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes FROM Episodes WHERE 1=1`;
    const params = [];
    if (refSeason) {
        sql += ` AND REF_SeasonID = ?`;
        params.push(refSeason);
    }
    sql += ` ORDER BY EpisodeID ASC`;
    return await db.allAsync(sql, params);
};

// ==========================================
// BI_LOGICA SERIE
// ==========================================
const insertShow = async (title, description, dateStarted, dateEnded, hasEnded) => {
    const sql = `INSERT INTO Shows (Title, Description, DateStarted, DateEnded, hasEnded, Favourited) VALUES (?, ?, ?, ?, ?, 0)`;
    return await db.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded || 0]);
};

const updateShow = async (showId, fields, params) => {
    const sql = `UPDATE Shows SET ${fields.join(', ')} WHERE ShowID = ?`;
    return await db.runAsync(sql, [...params, showId]);
};

const deleteShow = async (showId) => {
    const sql = `DELETE FROM Shows WHERE ShowID = ?`;
    return await db.runAsync(sql, [showId]);
};

// ==========================================
// BI_LOGICA STAGIONI
// ==========================================
const insertSeason = async (title, description, dateStarted, dateEnded, hasEnded, refShow) => {
    const sql = `INSERT INTO Seasons (Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID) VALUES (?, ?, ?, ?, ?, ?)`;
    return await db.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded || 0, refShow]);
};

const updateSeason = async (seasonId, fields, params) => {
    const sql = `UPDATE Seasons SET ${fields.join(', ')} WHERE SeasonID = ?`;
    return await db.runAsync(sql, [...params, seasonId]);
};

const deleteSeason = async (seasonId) => {
    const sql = `DELETE FROM Seasons WHERE SeasonID = ?`;
    return await db.runAsync(sql, [seasonId]);
};

// ==========================================
// BI_LOGICA EPISODI
// ==========================================
const insertEpisodeFull = async (title, description, releaseDate, duration, refSeason, dubs, subs) => {
    const sql = `INSERT INTO Episodes (Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes) VALUES (?, ?, ?, ?, ?, 0, 0)`;
    const result = await db.runAsync(sql, [title, description, releaseDate, duration, refSeason]);
    const newEpisodeId = result.id;

    if (dubs && Array.isArray(dubs)) {
        for (const lang of dubs) {
            await db.runAsync(`INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`, [newEpisodeId, lang]);
        }
    }
    if (subs && Array.isArray(subs)) {
        for (const lang of subs) {
            await db.runAsync(`INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (?, ?)`, [newEpisodeId, lang]);
        }
    }
    return result;
};

const updateEpisodeFull = async (episodeId, fields, fieldsParams, dubs, subs) => {
    let result = { changes: 1 };
    
    if (fields.length > 0) {
        const sql = `UPDATE Episodes SET ${fields.join(', ')} WHERE EpisodeID = ?`;
        result = await db.runAsync(sql, [...fieldsParams, episodeId]);
    }

    if (result.changes > 0) {
        if (dubs && Array.isArray(dubs)) {
            await db.runAsync(`DELETE FROM "EpisodeLanguage" WHERE "REF_EpisodeID" = ?`, [episodeId]);
            for (const lang of dubs) {
                await db.runAsync(`INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`, [episodeId, lang]);
            }
        }
        if (subs && Array.isArray(subs)) {
            await db.runAsync(`DELETE FROM "EpisodeSub" WHERE "REF_EpisodeID" = ?`, [episodeId]);
            for (const lang of subs) {
                await db.runAsync(`INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (?, ?)`, [episodeId, lang]);
            }
        }
    }
    return result;
};

const deleteEpisode = async (episodeId) => {
    const sql = `DELETE FROM Episodes WHERE EpisodeID = ?`;
    return await db.runAsync(sql, [episodeId]);
};

// ==========================================
// BI_LOGICA PROPIC
// ==========================================
const insertPropic = async (propicPath) => {
    const sql = `INSERT INTO Propics (PropicPath) VALUES (?)`;
    return await db.runAsync(sql, [propicPath]);
};

const deletePropicByPath = async (propicPath) => {
    const sql = `DELETE FROM Propics WHERE PropicPath = ?`;
    return await db.runAsync(sql, [propicPath]);
};

module.exports = {
    getAllShows,
    getAllSeasons,
    getAllEpisodes,
    insertShow,
    updateShow,
    deleteShow,
    insertSeason,
    updateSeason,
    deleteSeason,
    insertEpisodeFull,
    updateEpisodeFull,
    deleteEpisode,
    insertPropic,
    deletePropicByPath
};