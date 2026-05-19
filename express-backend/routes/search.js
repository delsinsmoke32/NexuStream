const express = require('express');
// Mantenuto mergeParams: true come nel tuo originale
const router = express.Router({ mergeParams: true }); 
const showController = require('../controllers/showController');
const authOptional = require("../middleware/authOptional");
const { query } = require('express-validator');


// Abbinato lo schema Swagger protetto dai trattini bassi
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Cerca serie TV (Shows) per titolo o descrizione
 *     description: Restituisce una lista di show ordinati per rilevanza (il match nel titolo vale più del match nella descrizione).
 *     tags:
 *       - Shows
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         required: true
 *         schema:
 *           type: string
 *         description: Il testo da cercare nel titolo o nella descrizione
 *         example: breaking
 *     responses:
 *       200:
 *         description: Ricerca completata con successo. Restituisce l'array dei risultati.
 *       400:
 *         description: Termine di ricerca mancante o non valido.
 *       500:
 *         description: Errore interno del server durante la ricerca.
 */


router.get('/', authOptional, [
    query('searchTerm').isString().notEmpty().trim().withMessage("Il termine di ricerca deve essere una stringa")
], showController.search);

module.exports = router;