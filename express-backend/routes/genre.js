const express = require('express');
const router = express.Router({ mergeParams: true });
const genreController = require('../controllers/genreController');
const authOptional = require("../middleware/authOptional");


 /**
 * @swagger
 * /api/genres:
 *  get:
 *    summary: Recupera l'elenco di tutti i generi disponibili
 *    tags: 
 *      - Genres
 *    responses:
 *      200:
 *        description: Lista dei generi recuperata con successo
 *      500:
 *        description: Errore interno del server
 */

router.get('/', authOptional, genreController.getGenres);

module.exports = router;