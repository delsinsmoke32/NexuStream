require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db");
const isCataloguer = require("../middleware/isCataloguer");
const { query, body, param, validationResult } = require('express-validator');

router.use(isCataloguer);

//-------------------------------------
//      GET - RECUPERO CONTENUTI
//-------------------------------------

// GET /api/cataloguer/shows -> Prende tutte le serie
router.get('/shows', [
    // Opzionale: permette di cercare una serie specifica per titolo nella dashboard
    query('search').optional().isString().trim().withMessage("Il parametro di ricerca deve essere una stringa")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { search } = req.query;
    let sql = `SELECT ShowID, Title, Description, DateStarted, DateEnded, hasEnded FROM Shows WHERE 1=1`;
    const params = [];

    if (search) {
        sql += ` AND Title LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY Title ASC`;

    try {
        const shows = await dbf.allAsync(sql, params);
        return res.status(200).json(shows);
    } catch (err) {
        console.error("Errore GET shows cataloguer: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


// GET /api/cataloguer/seasons -> Prende le stagioni (filtrabili per serie)
router.get('/seasons', [
    // L'ID della serie è opzionale: se lo passi vedi le stagioni di quella serie, se non lo passi le vedi tutte
    query('refShow').optional().isInt({ min: 1 }).withMessage("L'ID della serie deve essere un intero valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { refShow } = req.query;
    let sql = `SELECT SeasonID, Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID FROM Seasons WHERE 1=1`;
    const params = [];

    if (refShow) {
        sql += ` AND REF_ShowID = ?`;
        params.push(refShow);
    }

    sql += ` ORDER BY SeasonID ASC`;

    try {
        const seasons = await dbf.allAsync(sql, params);
        return res.status(200).json(seasons);
    } catch (err) {
        console.error("Errore GET seasons cataloguer: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


// GET /api/cataloguer/episodes -> Prende gli episodi (filtrabili per stagione)
router.get('/episodes', [
     // L'ID della stagione è opzionale: se lo passi vedi gli episodi di quella stagione, se non lo passi li vedi tutti
    query('refSeason').optional().isInt({ min: 1 }).withMessage("L'ID della stagione deve essere un intero valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { refSeason } = req.query;
    let sql = `SELECT EpisodeID, Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes FROM Episodes WHERE 1=1`;
    const params = [];

    if (refSeason) {
        sql += ` AND REF_SeasonID = ?`;
        params.push(refSeason);
    }

    sql += ` ORDER BY EpisodeID ASC`;

    try {
        const episodes = await dbf.allAsync(sql, params);
        return res.status(200).json(episodes);
    } catch (err) {
        console.error("Errore GET episodes cataloguer: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//-------------------------------------
//           GESTIONE SERIE
//-------------------------------------

// POST /api/cataloguer/shows/add -> aggiunge serie
router.post('/shows/add', [
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateStarted').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data d'inizio deve essere YYYY-MM-DD"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data di fine deve essere YYYY-MM-DD"),
    body('hasEnded').optional().isInt({ min: 0, max: 1 }).withMessage("hasEnded deve essere 0 o 1")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, description, dateStarted, dateEnded, hasEnded } = req.body;

    if (!title || !description || !dateStarted) {
        return res.status(400).json({message: "Titolo, Descrizione e Data d'Inizio sono obbligatori."});
    }

    let sql = `INSERT INTO Shows (Title, Description, DateStarted, DateEnded, hasEnded, Favourited)
                VALUES (?, ?, ?, ?, ?, 0)`;
    
    try {
        const result = await dbf.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded || 0]);
        return res.status(201).json({
            message: "Serie creata con successo!",
            showId: result.id});
    } catch (err) {
        console.error("Errore query aggiunta serie: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/shows/modify/:id -> modifica serie
router.post('/shows/modify/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID serie non valido"),
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('hasEnded').optional().isInt({ min: 0, max: 1 }).withMessage("hasEnded deve essere 0 o 1")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const showid = req.params.id;
    const { title, description, dateEnded, hasEnded } = req.body;

    let updateFields = [];
    let params = [];

    if (title !== undefined) {updateFields.push('Title = ?'); params.push(title);}
    if (description !== undefined) {updateFields.push('Description = ?'); params.push(description);}
    if (dateEnded !== undefined) {updateFields.push('DateEnded = ?'); params.push(dateEnded);}
    if (hasEnded !== undefined) {updateFields.push('hasEnded = ?'); params.push(hasEnded);}

    if (updateFields.length === 0) {
        return res.status(400).json({message: "Inserisci qualche parametero da modificare."});
    }

    params.push(showid);

    const sql = `UPDATE Shows SET ${updateFields.join(', ')} WHERE ShowID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, params);
        if (result.changes === 0){
            return res.status(404).json({ error: "La serie specificata non è stata trovata." });
        }
        return res.status(200).json({message: "Serie aggiornata con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/shows/delete/:id -> cancella serie
router.post('/shows/delete/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID serie non valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const showid = req.params.id;
    const sql = `DELETE FROM Shows WHERE ShowID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, [showid]);
        if (result.changes === 0){
            return res.status(404).json({ error: "La serie specificata non è stata trovata." });
        }
        return res.status(200).json({message: "Serie cancellata con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//-------------------------------------
//          GESTIONE STAGIONI
//-------------------------------------

// POST /api/cataloguer/seasons/add -> aggiunge stagione
router.post('/seasons/add', [
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateStarted').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data d'inizio deve essere YYYY-MM-DD"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data di fine deve essere YYYY-MM-DD"),
    body('hasEnded').optional().isInt({ min: 0, max: 1 }).withMessage("hasEnded deve essere 0 o 1"),
    body('refShow').isInt({ min: 1 }).withMessage("ID della serie non valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dateStarted, dateEnded, hasEnded, refShow} = req.body;

    if (!title || !description || !dateStarted || !refShow) {
        return res.status(400).json({message: "Titolo, Descrizione, Data d'Inizio e Riferimento alla Serie sono obbligatori."});
    }

    const sql = `INSERT INTO Seasons (Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID)
                VALUES (?, ?, ?, ?, ?, ?)`;
    
    try {
        const result = await dbf.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded || 0, refShow]);
        return res.status(201).json({
            message: "Stagione creata con successo!",
            seasonId: result.id});
    } catch (err) {
        console.error("Errore query aggiunta stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/seasons/modify/:id -> modifica stagione
router.post('/seasons/modify/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('hasEnded').optional().isInt({ min: 0, max: 1 }).withMessage("hasEnded deve essere 0 o 1"),
    body('refShow').optional().isInt({ min: 1 }).withMessage("ID della serie non valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const seasonid = req.params.id;
    const { title, description, dateEnded, hasEnded, refShow } = req.body;

    let updateFields = [];
    let params = [];

    if (title !== undefined) {updateFields.push('Title = ?'); params.push(title);}
    if (description !== undefined) {updateFields.push('Description = ?'); params.push(description);}
    if (dateEnded !== undefined) {updateFields.push('DateEnded = ?'); params.push(dateEnded);}
    if (hasEnded !== undefined) {updateFields.push('hasEnded = ?'); params.push(hasEnded);}
    if (refShow !== undefined) {updateFields.push('REF_ShowID = ?'); params.push(refShow);}

    if (updateFields.length === 0) {
        return res.status(400).json({message: "Inserisci qualche parametro da modificare."});
    }

    params.push(seasonid);

    const sql = `UPDATE Seasons SET ${updateFields.join(', ')} WHERE SeasonID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, params);
        if (result.changes === 0){
            return res.status(404).json({ error: "La stagione specificata non è stata trovata." });
        }
        return res.status(200).json({message: "Stagione aggiornata con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/seasons/delete/:id -> cancella stagione
router.post('/seasons/delete/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID stagione non valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const seasonid = req.params.id;
    const sql = `DELETE FROM Seasons WHERE SeasonID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, [seasonid]);
        if (result.changes === 0){
            return res.status(404).json({ error: "La stagione specificata non è stata trovata." });
        }
        return res.status(200).json({message: "Stagione cancellata con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//------------------------------------
//          GESTIONE EPISODI
//------------------------------------

// POST /api/cataloguer/episodes/add -> aggiunge episodio
router.post('/episodes/add', [
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('releaseDate').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('duration').isInt({ min: 1 }).withMessage("La durata deve essere un intero positivo"),
    body('refSeason').isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, releaseDate, duration, refSeason, DubLanguages, SubLanguages } = req.body;

    if (!title || !description || !duration || !refSeason || !releaseDate) {
        return res.status(400).json({message: "Titolo, Descrizione, Durata, Data di Uscita e Riferimento alla Stagione sono obbligatori."});
    }

    const sql = `INSERT INTO Episodes (Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes)
                VALUES (?, ?, ?, ?, ?, 0, 0)`;
    
    try {
        const result = await dbf.runAsync(sql, [title, description, releaseDate, duration, refSeason]);
        const newEpisodeId = result.id;

        // DUBS
        if (DubLanguages && Array.isArray(DubLanguages)) {
            for (const lang of DubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [newEpisodeId, lang]
                );
            }
        }

        // SUBS
        if (SubLanguages && Array.isArray(SubLanguages)) {
            for (const lang of SubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [newEpisodeId, lang]
                );
            }
        }

        return res.status(201).json({
            message: "Episodio creato con successo!",
            episodeId: result.id});
    } catch (err) {
        console.error("Errore query aggiunta episodio: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/episodes/modify/:id -> modifica episodio
router.post('/episodes/modify/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('refSeason').optional().isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const episodeid = req.params.id;
    const { title, description, refSeason, DubLanguages, SubLanguages} = req.body;

    let updateFields = [];
    let params = [];

    if (title !== undefined) {updateFields.push('Title = ?'); params.push(title);}
    if (description !== undefined) {updateFields.push('Description = ?'); params.push(description);}
    if (refSeason !== undefined) {updateFields.push('REF_SeasonID = ?'); params.push(refSeason);}
    

    if (updateFields.length === 0 && !DubLanguages && !SubLanguages) {
        return res.status(400).json({message: "Inserisci qualche parametro da modificare."});
    }

    try {
        if (updateFields.length > 0) {
            params.push(episodeid);
            const sql = `UPDATE Episodes SET ${updateFields.join(', ')} WHERE EpisodeID = ?`;
            const result = await dbf.runAsync(sql, params);

            if (result.changes === 0){
                return res.status(404).json({ error: "L'episodio specificato non è stata trovato." });
            }
        }

        // DUBS
        if (DubLanguages && Array.isArray(DubLanguages)) {
            await dbf.runAsync(`DELETE FROM "EpisodeLanguage" WHERE "REF_EpisodeID" = ?`, [episodeid]);
            for (const lang of DubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [episodeid, lang]
                );
            }
        }

        // SUBS
        if (SubLanguages && Array.isArray(SubLanguages)) {
            await dbf.runAsync(`DELETE FROM "EpisodeSub" WHERE "REF_EpisodeID" = ?`, [episodeid]);
            for (const lang of SubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [episodeid, lang]
                );
            }
        }

        return res.status(200).json({message: "Episodio aggiornato con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

// POST /api/cataloguer/episodes/delete/:id -> cancella episodio
router.post('/episodes/delete/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const episodeid = req.params.id;
    const sql = `DELETE FROM Episodes WHERE EpisodeID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, [episodeid]);
        if (result.changes === 0){
            return res.status(404).json({ error: "L'episodio specificato non è stata trovato." });
        }
        return res.status(200).json({message: "Episodio cancellato con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//------------------------------------
//          GESTIONE PROPIC
//------------------------------------

// POST /api/cataloguer/propic/add -> aggiungi propic
router.post('/propic/add', [
    body('propicPath').isString().trim().notEmpty().withMessage("Il path della propic non è valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { propicPath } = req.body;
    const sql = `INSERT INTO Propics (PropicPath) VALUES (?)`;

    try {
        await dbf.runAsync(sql, [propicPath]);
        return res.status(200).json({message: "Propic aggiunta con successo!"});
    } catch (err) {
        console.error("Errore query aggiunta propic: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


// POST /api/cataloguer/propic/delete -> cancella propic
router.post('/propic/delete', [
    body('propicPath').isString().trim().notEmpty().withMessage("Il path della propic non è valido")
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { propicPath } = req.body;
    const sql = `DELETE FROM Propics WHERE PropicPath = ?`;

    try {
        const result = await dbf.runAsync(sql, [propicPath]);
        if (result.changes === 0){
            return res.status(404).json({ error: "Il path propic specificato non esiste." });
        }
        return res.status(200).json({message: "Propic cancellata con successo!"});
    } catch (err) {
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;