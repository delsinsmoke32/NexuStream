const express = require('express');
const router = express.Router({ mergeParams: true });
const cataloguerController = require('../controllers/cataloguerController');
const isCataloguer = require("../middleware/isCataloguer");
const { query, body, param } = require('express-validator');

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


/**
 * @swagger
 * /api/cataloguer/shows/add:
 *   post:
 *     summary: Aggiunge una nuova serie (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Shows
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
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
 *     responses:
 *       201:
 *         description: Serie creata con successo
 */


router.post('/shows/add', [
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateStarted').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data d'inizio deve essere YYYY-MM-DD"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data di fine deve essere YYYY-MM-DD"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),
    body('bannerURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
], cataloguerController.addShow);


/**
 * @swagger
 * /api/cataloguer/shows/{id}:
 *   patch:
 *     summary: Modifica una serie esistente (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Shows
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dateEnded:
 *                 type: string
 *                 format: date
 *               hasEnded:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Serie aggiornata con successo
 */


router.patch('/shows/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID serie non valido"),
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('dateEnded').optional({ checkFalsy: true }).isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa"),
    body('bannerURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
], cataloguerController.modifyShow);


/**
 * @swagger
 * /api/cataloguer/shows/{id}:
 *   delete:
 *     summary: Elimina una serie (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Shows
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
 *         description: Serie eliminata con successo
 */


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
 *               title:
 *                 type: string
 *               description:
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
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
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
 *               title:
 *                 type: string
 *               description:
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
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
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


/**
 * @swagger
 * /api/cataloguer/episodes/add:
 *   post:
 *     summary: Aggiunge un episodio con lingue e sub (Solo Catalogatori)
 *     tags:
 *       - Cataloguer Episodes
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
 *               - releaseDate
 *               - duration
 *               - refSeason
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               duration:
 *                 type: integer
 *               refSeason:
 *                 type: integer
 *               DubLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *               SubLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Episodio creato
 */


router.post('/episodes/add', [
    body('title').isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('releaseDate').isDate({ format: 'YYYY-MM-DD' }).withMessage("La data deve essere YYYY-MM-DD"),
    body('duration').isInt({ min: 1 }).withMessage("La durata deve essere un intero positivo"),
    body('refSeason').isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('episodeNumber').isInt({ min: 1 }).withMessage("Numero di episodio non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
], cataloguerController.addEpisode);


/**
 * @swagger
 * /api/cataloguer/episodes/{id}:
 *   patch:
 *     summary: Modifica un episodio e aggiorna lingue/sub (Solo Catalogatori)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               refSeason:
 *                 type: integer
 *               DubLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *               SubLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Episodio aggiornato
 */


router.patch('/episodes/:id', [
    param('id').isInt({ min: 1 }).withMessage("ID episodio non valido"),
    body('title').optional().isString().trim().notEmpty().withMessage("Titolo non valido"),
    body('description').optional().isString().trim().notEmpty().withMessage("Descrizione non valida"),
    body('refSeason').optional().isInt({ min: 1 }).withMessage("ID stagione non valido"),
    body('DubLanguages').optional().isArray().withMessage("DubLanguages deve essere un array"),
    body('SubLanguages').optional().isArray().withMessage("SubLanguages deve essere un array"),
    body('thumbnailURI').optional().isString().trim().notEmpty().withMessage("L'URI deve essere una stringa")
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


// ==========================================
// ROTTE IMMAGINI PROFILO (PROPICS)
// ==========================================


/**
 * @swagger
 * /api/cataloguer/propic:
 *   post:
 *     summary: Aggiunge un path immagine profilo (Solo Catalogatori)
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
 *         description: Aggiunta con successo
 */


router.post('/propic', [
    body('propicURI').isString().trim().notEmpty().withMessage("L'URI della propic non è valido")
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


router.delete('/propic', [
    body('propicURI').isString().trim().notEmpty().withMessage("L'URI della propic non è valido")
], cataloguerController.removePropic);

module.exports = router;