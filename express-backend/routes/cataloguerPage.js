const express = require('express');
const router = express.Router({ mergeParams: true });
const cataloguerController = require('../controllers/cataloguerController');
const episodeController = require('../controllers/episodeController');
const propicController = require('../controllers/propicController');
const multerMiddleware = require("../middleware/multerConfig");
const isCataloguer = require("../middleware/isCataloguer");
const { query, body, param } = require('express-validator');

// SWAGGER MANCANTE PER LE ROTTE CHE RICHIEDONO FILE UPLOAD

router.use(isCataloguer);

// ==========================================
// ROTTE SERIE (SHOWS)
// ==========================================


/**
 * @swagger
 * /api/cataloguer/shows:
 *   get:
 *     summary: Elenca tutte le serie tv (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Shows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successo
 */


router.get('/shows', [
    query('search').optional().isString().trim().withMessage("Il parametro di ricerca deve essere una stringa")
], cataloguerController.getShows);


router.post('/shows/add', [
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    // Le altre lingue sono opzionali
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    
    body('dateStarted').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data d'inizio deve essere YYYY-MM-DD"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data di fine deve essere YYYY-MM-DD"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),
    body('bannerURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
], cataloguerController.addShow);


router.patch('/shows/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID serie non valido"),
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    // Le altre lingue sono opzionali
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),
    body('bannerURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
], cataloguerController.modifyShow);


router.delete('/shows/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID serie non valido")
], cataloguerController.removeShow);


// ==========================================
// ROTTE STAGIONI (SEASONS)
// ==========================================


/**
 * @swagger
 * /api/cataloguer/seasons:
 *   get:
 *     summary: Elenca le stagioni (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Seasons
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refShow
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successo
 */


router.get('/seasons', [
    query('refShow').optional().isInt({ min: 1 }).withMessage("L'ID della serie deve essere un intero valido")
], cataloguerController.getSeasons);


/**
 * @swagger
 * /api/cataloguer/seasons/add:
 *   post:
 *     summary: Aggiunge una nuova stagione (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Seasons
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - dateStarted
 *               - refShow
 *             properties:
 *               title_it:
 *                 type: string
 *               title_en:
 *                 type: string
 *               description_it:
 *                 type: string
 *               description_en:
 *                 type: string
 *               dateStarted:
 *                 type: string
 *                 format: date
 *               dateEnded:
 *                 type: string
 *                 format: date
 *               hasEnded:
 *                 type: integer
 *                 enum: [0, 1]
 *               refShow:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Stagione creata
 */


router.post('/seasons/add', [
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    // Le altre lingue sono opzionali
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    body('dateStarted').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data d'inizio deve essere YYYY-MM-DD"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data di fine deve essere YYYY-MM-DD"),
    body('refShow').isInt({ min: 1 }).withMessage("ID della serie non valido"),
    body('seasonNumber').isInt({ min: 1 }).withMessage("Numero di stagione non valido")
], cataloguerController.addSeason);


/**
 * @swagger
 * /api/cataloguer/seasons/{id}:
 *   patch:
 *     summary: Modifica una stagione (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Seasons
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title_it:
 *                 type: string
 *               title_en:
 *                 type: string
 *               description_it:
 *                 type: string
 *               description_en:
 *                 type: string
 *               dateEnded:
 *                 type: string
 *                 format: date
 *               hasEnded:
 *                 type: integer
 *                 enum: [0, 1]
 *               refShow:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stagione aggiornata
 */


router.patch('/seasons/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    // Le altre lingue sono opzionali
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('hasEnded').optional().isInt({ min: 0, max: 1 }).withMessage("hasEnded deve essere 0 o 1"),
    body('refShow').optional().isInt({ min: 1 }).withMessage("ID della serie non valido")
], cataloguerController.modifySeason);


/**
 * @swagger
 * /api/cataloguer/seasons/{id}:
 *   delete:
 *     summary: Elimina una stagione (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Seasons
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stagione eliminata
 */


router.delete('/seasons/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID stagione non valido")
], cataloguerController.removeSeason);


// ==========================================
// ROTTE EPISODI (EPISODES)
// ==========================================


/**
 * @swagger
 * /api/cataloguer/episodes:
 *   get:
 *     summary: Elenca gli episodi (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Episodes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refSeason
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successo
 */


router.get('/episodes', [
    query('refSeason').optional().isInt({ min: 1 }).withMessage("L'ID della stagione deve essere un intero valido")
], cataloguerController.getEpisodes);



router.post('/episodes/add', [
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    // Le altre lingue sono opzionali
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    body('releaseDate').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('duration').isInt({ min: 1 }).withMessage("La durata deve essere un intero positivo"),
    body('refSeason').isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('episodeNumber').isInt({ min: 1 }).withMessage("Numero di episodio non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),

    //  NUOVI CONTROLLI PER I MEDIA
    body('rawVideoURI').optional().isString().trim().notEmpty().withMessage("L'URI del video deve essere una stringa"),
    
    body('audioTracks').optional().isArray().withMessage("audioTracks deve essere un array"),
    body('audioTracks.*.lang').optional().isString().trim(),
    body('audioTracks.*.uri').optional().isString().trim(),
    
    body('subTracks').optional().isArray().withMessage("subTracks deve essere un array"),
    body('subTracks.*.lang').optional().isString().trim(),
    body('subTracks.*.uri').optional().isString().trim(),

    //  BLINDATURA MARKER TEMPORALI
    body('times').optional().isArray().withMessage("Times deve essere un array"),
    body('times.*.StartTime').isInt({ min: 0 }).withMessage("StartTime deve essere un numero positivo o zero"),
    body('times.*.EndTime').isInt({ min: 1 }).withMessage("EndTime deve essere maggiore di 0"),
    body('times.*.Type').isIn(['intro', 'recap', 'credits']).withMessage("Tipo di marker non valido")

], cataloguerController.addEpisode);



router.patch('/episodes/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    
    body('title_it').isString().trim().notEmpty().withMessage("Il titolo italiano è obbligatorio"),
    body('description_it').isString().trim().notEmpty().withMessage("La descrizione italiana è obbligatoria"),
    body('title_en').optional({ checkFalsy: true }).isString().trim(),
    body('description_en').optional({ checkFalsy: true }).isString().trim(),
    body('refSeason').optional().isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),

    // campi extra
    body('duration').optional().isInt({ min: 1 }).withMessage("La durata deve essere un intero positivo"),
    body('episodeNumber').optional().isInt({ min: 1 }).withMessage("Numero di episodio non valido"),

    //  tracce
    body('audioTracks').optional().isArray().withMessage("audioTracks deve essere un array"),
    body('audioTracks.*.lang').optional().isString().trim(),
    body('audioTracks.*.uri').optional().isString().trim(),
    
    body('subTracks').optional().isArray().withMessage("subTracks deve essere un array"),
    body('subTracks.*.lang').optional().isString().trim(),
    body('subTracks.*.uri').optional().isString().trim(),

    // marker temporali
    body('times').optional().isArray().withMessage("Times deve essere un array"),
    body('times.*.StartTime').optional().isInt({ min: 0 }).withMessage("StartTime deve essere un numero positivo o zero"),
    body('times.*.EndTime').optional().isInt({ min: 1 }).withMessage("EndTime deve essere maggiore di 0"),
    body('times.*.Type').optional().isIn(['intro', 'recap', 'credits']).withMessage("Tipo di marker non valido")

], cataloguerController.modifyEpisode);


/**
 * @swagger
 * /api/cataloguer/episodes/{id}:
 *   delete:
 *     summary: Elimina un episodio (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Episodes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminato
 */


router.delete('/episodes/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido")
], cataloguerController.removeEpisode);


router.delete('/episodes/:id/tracks/:type/:lang', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    param('type').isIn(['audio', 'subs']).withMessage("Tipo non valido"),
    param('lang').isString().trim().notEmpty().withMessage("ID lingua non valido")
], cataloguerController.removeTrack);


router.get('/episodes/:id/times', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido")
], episodeController.getTimes);

// ==========================================
// ROTTE IMMAGINI PROFILO (PROPICS)
// ==========================================

router.get('/propics', propicController.getPropics);

router.post('/propics/add', [
    multerMiddleware.validateAvatar,
    body('bundle').isString().trim().notEmpty().withMessage("Il bundle della propic non è valido"),
], cataloguerController.addPropic);

/**
 * @swagger
 * /api/cataloguer/propic:
 *   delete:
 *     summary: Rimuove una immagine profilo tramite path (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Profile Pictures
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propicURI
 *             properties:
 *               propicURI:
 *                 type: string
 *     responses:
 *       200:
 *         description: Eliminata con successo
 */


router.delete('/propics', [
    body('propicURI').isString().trim().notEmpty().withMessage("L'URI della propic non è valido")
], cataloguerController.removePropic);

module.exports = router;