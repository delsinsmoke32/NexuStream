require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db");
const isCataloguer = require("../middleware/isCataloguer");
const { body, validationResult } = require('express-validator');
//DA AGGIUNGERE ERROR CHECKING, SIA QUI CHE VIRTUALMENTE OVUNQUE

router.use(isCataloguer);

//-------------------------------------
//           GESTIONE SERIE
//-------------------------------------

//POST /api/cataloguer/shows/add -> aggiunge serie
router.post('/shows/add', async (req, res) => {
    const { title, description, dateStarted, dateEnded, hasEnded } = req.body;

    if (!title || !description || !dateStarted) {
        return res.status(401).json({message: "Titolo, Descrizione e Data d'Inizio sono obbligatori."});
    }

    const sql = `INSERT INTO Shows (Title, Description, DateStarted, DateEnded, hasEnded, Favourited)
                VALUES (?, ?, ?, ?, ?, 0)`;
    
    try {
        await dbf.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded]);
        return res.status(200).json({message: "Serie creata con successo!"});
    } catch (err) {
        console.error("Errore query aggiunta serie: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

//POST /api/cataloguer/shows/modify/:id -> modifica serie
router.post('/shows/modify/:id', async (req, res) => {
    const showid = req.params.id;
    const { title, description, dateEnded, hasEnded } = req.body;

    let updateFields = [];
    let params = [];

    if (title !== undefined) {updateFields.push('Title = ?'); params.push(title);}
    if (description !== undefined) {updateFields.push('Description = ?'); params.push(description);}
    if (dateEnded !== undefined) {updateFields.push('DateEnded = ?'); params.push(dateEnded);}
    if (hasEnded !== undefined) {updateFields.push('hasEnded = ?'); params.push(hasEnded);}

    if (updateFields.length === 0) {
        return res.status(400).json({message: "Inserisci qualche parametro da modificare."});
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

//POST /api/cataloguer/shows/delete/:id -> cancella serie
router.post('/shows/delete/:id', async (req, res) => {
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

//POST /api/cataloguer/seasons/add -> aggiunge stagione
router.post('/seasons/add', async (req, res) => {
    const { title, description, dateStarted, dateEnded, hasEnded, refShow} = req.body;

    if (!title || !description || !dateStarted || !refShow) {
        return res.status(401).json({message: "Titolo, Descrizione, Data d'Inizio e Riferimento alla Serie sono obbligatori."});
    }

    const sql = `INSERT INTO Seasons (Title, Description, DateStarted, DateEnded, hasEnded, REF_ShowID)
                VALUES (?, ?, ?, ?, ?, ?)`;
    
    try {
        await dbf.runAsync(sql, [title, description, dateStarted, dateEnded || null, hasEnded, refShow]);
        return res.status(200).json({message: "Stagione creata con successo!"});
    } catch (err) {
        console.error("Errore query aggiunta stagione: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

//POST /api/cataloguer/seasons/modify/:id -> modifica stagione
router.post('/seasons/modify/:id', async (req, res) => {
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

//POST /api/cataloguer/seasons/delete/:id -> cancella stagione
router.post('/seasons/delete/:id', async (req, res) => {
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

//POST /api/cataloguer/episodes/add -> aggiunge episodio
router.post('/episodes/add', async (req, res) => {
    const { title, description, releaseDate, duration, refSeason, DubLanguages, SubLanguages } = req.body;

    if (!title || !description || !duration || !refSeason || !releaseDate) {
        return res.status(401).json({message: "Titolo, Descrizione, Durata, Data di Uscita e Riferimento alla Stagione sono obbligatori."});
    }

    const sql = `INSERT INTO Episodes (Title, Description, ReleaseDate, Duration, REF_SeasonID, Streams, Likes)
                VALUES (?, ?, ?, ?, ?, 0, 0)`;
    
    try {
        const result = await dbf.runAsync(sql, [title, description, releaseDate, duration, refSeason]);
        const newEpisodeId = result.id;

        //DUBS
        if (DubLanguages && Array.isArray(DubLanguages)) {
            for (const lang of DubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [newEpisodeId, lang]
                );
            }
        }

        //SUBS
        if (SubLanguages && Array.isArray(SubLanguages)) {
            for (const lang of SubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [newEpisodeId, lang]
                );
            }
        }

        return res.status(200).json({message: "Episodio creato con successo!"});
    } catch (err) {
        console.error("Errore query aggiunta episodio: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

//POST /api/cataloguer/episodes/modify/:id -> modifica episodio
router.post('/episodes/modify/:id', async (req, res) => {
    const episodeid = req.params.id;
    const { title, description, refSeason, DubLanguages, SubLanguages} = req.body;

    let updateFields = [];
    let params = [];

    if (title !== undefined) {updateFields.push('Title = ?'); params.push(title);}
    if (description !== undefined) {updateFields.push('Description = ?'); params.push(description);}
    if (refSeason !== undefined) {updateFields.push('REF_SeasonID = ?'); params.push(refSeason);}
    

    if (updateFields.length === 0) {
        return res.status(400).json({message: "Inserisci qualche parametro da modificare."});
    }

    params.push(episodeid);

    const sql = `UPDATE Episodes SET ${updateFields.join(', ')} WHERE EpisodeID = ?`;
    
    try {
        const result = await dbf.runAsync(sql, params);

        if (result.changes === 0){
            return res.status(404).json({ error: "L'episodio specificato non è stata trovato." });
        }

        //DUBS
        if (DubLanguages && Array.isArray(DubLanguages)) {
            await dbf.runAsync(`DELETE FROM "EpisodeLanguage" WHERE "REF_EpisodeID" = ?`, [episodeid]);
            for (const lang of DubLanguages) {
                await dbf.runAsync(
                    `INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (?, ?)`,
                    [episodeid, lang]
                );
            }
        }

        //SUBS
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

//POST /api/cataloguer/episodes/delete/:id -> cancella episodio
router.post('/episodes/delete/:id', async (req, res) => {
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

//POST /api/cataloguer/propic/add -> aggiungi propic
router.post('/propic/add', async (req, res) => {
    const propicPath = req.body;

    const sql = `INSERT INTO Propics (PropicPath) VALUES (?)`;

    try {
        await dbf.runAsync(sql, [propicPath]);
        return res.status(200).json({message: "Propic aggiunta con successo!"});
    } catch (err) {
        console.error("Errore query aggiunta propic: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//POST /api/cataloguer/propic/delete -> cancella propic
router.post('/propic/delete', async (req, res) => {
    const propicPath = req.body;

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
