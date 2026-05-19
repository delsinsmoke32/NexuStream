const express = require('express');
const router = express.Router({ mergeParams: true });
const adminController = require('../controllers/adminController');
const isAdmin = require("../middleware/isAdmin");
const { query, body, param } = require('express-validator');

// Protezione globale dell'intero blocco di rotte
router.use(isAdmin);


/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Recupera la lista degli utenti con filtri avanzati (Solo Admin)
 *     description: Permette agli amministratori di scorrere gli utenti registrati, cercando per username/email o filtrando per ruolo amministrativo.
 *     tags:
 *       - Admin Panel
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           description: Testo per cercare parzialmente in username o email
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [mod, cataloguer, admin]
 *           description: Filtro per mostrare solo utenti con uno specifico ruolo
 *     responses:
 *       200:
 *         description: Array di utenti estratto con successo.
 *       400:
 *         description: Filtri o parametri non validi.
 *       403:
 *         description: Accesso negato, l'utente corrente non è un amministratore.
 *       500:
 *         description: Errore del server.
 */


router.get('/', [
    query('search').optional().isString().trim().notEmpty().withMessage("Termine di ricerca non valido"),
    query('role').optional().isIn(['mod', 'cataloguer', 'admin']).withMessage("Ruolo specificato non valido"),
], adminController.getUsersList);


/**
 * @swagger
 * /api/admin/users/{id}/roles:
 *   patch:
 *     summary: Aggiorna i permessi e i ruoli di uno specifico utente (Solo Admin)
 *     tags:
 *       - Admin Panel
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: ID numerico dell'utente da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isMod:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *               isCataloguer:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Ruoli dell'utente modificati sul DB.
 *       400:
 *         description: Dati del body non validi o body completamente vuoto.
 *       403:
 *         description: Token non valido o utente non amministratore.
 *       500:
 *         description: Errore del server.
 */


router.patch('/:id/roles', [
    param('id').isInt({ min: 1 }).withMessage("ID utente non valido"),
    body('isMod').optional().isInt({ min: 0, max: 1 }).withMessage("Valore mod non valido (0 o 1)"),
    body('isCataloguer').optional().isInt({ min: 0, max: 1 }).withMessage("Valore cataloguer non valido (0 o 1)")
], adminController.updateRoles);

module.exports = router;