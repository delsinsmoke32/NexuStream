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
 *  get:
 *    summary: Cerca serie TV (Shows) per titolo o descrizione
 *    description: Esegue una ricerca globale valutando il termine inserito in TUTTE le lingue del JSON. Restituisce una lista di show localizzati nella lingua dell'utente e ordinati per rilevanza.
 *    tags:
 *      - Shows
 *    parameters:
 *      - in: query
 *        name: searchTerm
 *        required: true
 *        schema:
 *          type: string
 *        description: Il testo da cercare nel titolo o nella descrizione delle serie TV
 *        example: pixel
 *    responses:
 *      200:
 *        description: Ricerca completata con successo. Restituisce l'array dei risultati ordinati per punteggio.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *            items:
 *              type: object
 *              properties:
 *                ShowID:
 *                  type: integer
 *                  example: 2
 *                DateStarted:
 *                  type: string
 *                  format: date
 *                  example: "2021-03-01"
 *                hasEnded:
 *                  type: integer
 *                  example: 1
 *                DateEnded:
 *                  type: string
 *                  format: date
 *                  example: "2022-05-10"
 *                Favourited:
 *                  type: integer
 *                  example: 3200
 *                ThumbnailURI:
 *                  type: string
 *                  example: "/static/thumbs/pixel.jpg"
 *                BannerURI:
 *                  type: string
 *                  example: "/static/banners/pixel-banner.jpg"
 *                Title:
 *                  type: string
 *                  description: Titolo dello show localizzato nella lingua dell'utente
 *                  example: "The Pixel Throne"
 *                Description:
 *                  type: string
 *                  description: Descrizione dello show localizzata nella lingua dell'utente
 *                  example: "A struggle for power in a fantasy world."
 *                RelevanceScore:
 *                  type: integer
 *                  description: Punteggio di rilevanza (10+ per match su titolo utente, 7 per titolo altre lingue, ecc.)
 *                  example: 10
 *      400:
 *        description: Termine di ricerca mancante, troppo corto o controlli formali falliti.
 *      500:
 *        description: Errore interno del server durante l'elaborazione della query di ricerca.
 */


router.get('/', authOptional, [
    query('searchTerm').isString().notEmpty().trim().withMessage("Il termine di ricerca deve essere una stringa")
], showController.search);

module.exports = router;