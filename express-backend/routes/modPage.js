const express = require('express');
const router = express.Router({ mergeParams: true });
const modController = require('../controllers/modController');
const isMod = require("../middleware/isMod");
const { query, body, param } = require('express-validator');

router.use(isMod);

//------------------------
// GESTIONE DISCUSSIONI
//------------------------

/**
 * @swagger
 * /api/mod/discussions:
 *  get:
 *    summary: Recupera la lista delle discussioni con filtro opzionale
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: query
 *        name: showClosed
 *        required: false
 *        schema:
 *          type: integer
 *          enum: [0, 1]
 *        description: Se impostato a 1 mostra anche le discussioni chiuse o scadute
 *    responses:
 *      200:
 *        description: Lista delle discussioni recuperata con successo
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  DiscussionID:
 *                    type: integer
 *                  REF EpisodeID:
 *                    type: integer
 *                  OpenDate:
 *                    type: string
 *                  CloseDate:
 *                    type: string
 *                  ForceClosed:
 *                    type: integer
 *                  Type:
 *                    type: string
 *      400:
 *        description: Parametro showClosed non valido
 *      401:
 *        description: Token mancante o non valido
 *      403:
 *        description: Utente non autorizzato (Non è un moderatore)
 *      500:
 *        description: Errore interno del server
 */

router.get('/discussions', [
    query('showClosed').optional().isInt({ min: 0, max: 1 }).withMessage("Lo show closed deve essere 0 o 1"),
    query('search').optional().isString().trim()
], modController.getDiscussions);

/**
 * @swagger
 * /api/mod/discussions:
 *  post:
 *    summary: Crea una nuova discussione per un episodio
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - REF EpisodeID
 *              - CloseDate
 *              - Type
 *            properties:
 *              REF EpisodeID:
 *                type: integer
 *              closeDate:
 *                type: string
 *                example: "2027-01-01 00:00"
 *              type:
 *                type: string
 *                example: "standard"
 *    responses:
 *      201:
 *        description: Discussione creata con successo
 *      400:
 *        description: Dati di input non validi
 *      500:
 *        description: Errore interno del server
 */

router.post('/discussions', [
    body('REF_EpisodeID').isInt({ min: 1 }).notEmpty().withMessage("ID episodio non valido"),
    body('closeDate').isString().notEmpty().withMessage("Data di chiusura richiesta"),
    body('type').isString().notEmpty().withMessage("Tipo discussione richiesto")
], modController.createDiscussion);

/**
 * @swagger
 * /api/mod/discussions/{discussionId}:
 *  patch:
 *    summary: Modifica una discussione esistente (data chiusura o stato bloccato)
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              closeDate:
 *                type: string
 *              forceClosed:
 *                type: integer
 *                enum: [0, 1]
 *              Type:
 *                type: string
 *    responses:
 *      200:
 *        description: Discussione aggiornata con successo
 *      400:
 *        description: Input o ID non valido
 *      404:
 *        description: Discussione non trovata
 *      500:
 *        description: Errore interno del server
 */
router.patch('/discussions/:discussionId', [
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido"),
    body('closeDate').optional().isString().withMessage("La data deve essere una stringa"),
    body('forceClosed').optional().isInt({ min: 0, max: 1 }).withMessage("ForceClosed deve essere 0 o 1"),
    body('type').optional().isString().withMessage("Tipo deve essere una stringa")
], modController.updateDiscussion);

/**
 * @swagger
 * /api/mod/discussions/{discussionId}:
 *  delete:
 *    summary: Elimina una discussione e i relativi commenti a cascata
 *    tags: [Moderation]
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: discussionId
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      200:
 *        description: Discussione eliminata con successo
 *      400:
 *        description: ID discussione non valido
 *      404:
 *        description: Discussione non trovata
 *      500:
 *        description: Errore interno del server
 */
router.delete('/discussions/:discussionId', [
    param('discussionId').isInt({ min: 1 }).notEmpty().withMessage("ID discussione non valido")
], modController.deleteDiscussion);

//------------------------
// GESTIONE UTENTI
//------------------------

/**
 * @swagger
 * /api/mod/users:
 *   get:
 *     summary: Recupera la lista filtrata e paginata degli utenti normali
 *     tags: [Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Filtra gli utenti per Username o Email (ricerca parziale)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Numero della pagina da caricare
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         required: false
 *         description: Numero massimo di risultati per pagina
 *     responses:
 *       200:
 *         description: Lista degli utenti recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   UserID:
 *                     type: integer
 *                     example: 12
 *                   Username:
 *                     type: string
 *                     example: "mario_rossi"
 *                   Email:
 *                     type: string
 *                     example: "mario@example.com"
 *                   REF_PropicURI:
 *                     type: string
 *                     nullable: true
 *                     example: "uploads/propics/avatar12.png"
 *                   canComment:
 *                     type: integer
 *                     enum: [0, 1]
 *                     example: 1
 *                   BannedUntil:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2026-06-05T18:00:00.000Z"
 *       400:
 *         description: Errori di validazione nei parametri di query
 *       401:
 *         description: Token mancante o non valido
 *       403:
 *         description: Accesso negato (L'utente loggato non è un Moderatore)
 *       500:
 *         description: Errore interno del server
 */

router.get('/users', [
    query('search').optional().isString().trim().notEmpty().withMessage("Termine di ricerca non valido"),
], modController.getUsersList);

/**
 * @swagger
 * /api/mod/users/{userId}/comments:
 *   get:
 *     summary: Recupera i commenti di uno specifico utente ordinati per gravità di report
 *     tags: [Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente di cui si vogliono esaminare i commenti
 *     responses:
 *       200:
 *         description: Array dei commenti dell'utente restituito con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   CommentID:
 *                     type: integer
 *                     example: 104
 *                   CommentText:
 *                     type: string
 *                     example: "Questo è un commento segnalato"
 *                   DateCommented:
 *                     type: string
 *                     example: "2026-05-29 14:30:00"
 *                   Likes:
 *                     type: integer
 *                     example: 200
 *                   ReportCount:
 *                     type: integer
 *                     example: 5
 *                   isHidden:
 *                     type: integer
 *                     example: 0
 *                   isApproved:
 *                     type: integer
 *                     example: 0
 *                   REF_UserID:
 *                     type: integer
 *                     example: 12
 *                   REF_DiscussionID:
 *                     type: integer
 *                     example: 10
 *                   REF_CommentID:
 *                     type: integer
 *                     example: 5
 *       400:
 *         description: ID utente non valido o malformato
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore interno del server
 */

router.get('/users/:userId/comments', [
    param('userId').isInt({ min: 1 }).notEmpty().withMessage("ID utente non valido")
], modController.getUserComments);

router.patch('/users/:userId/comments/:commentId/hide', [
    param('userId').isInt({ min: 1 }).notEmpty().withMessage("ID utente non valido"),
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isHidden').isInt({min: 0, max: 1}).notEmpty().withMessage("Valore isHidden non valido")
], modController.hideComment);

router.patch('/users/:userId/comments/:commentId/approve', [
    param('userId').isInt({ min: 1 }).notEmpty().withMessage("ID utente non valido"),
    param('commentId').isInt({ min: 1 }).notEmpty().withMessage("ID commento non valido"),
    body('isApproved').isInt({min: 0, max: 1}).notEmpty().withMessage("Valore isApproved non valido")
], modController.approveComment);

//----------------
// GESTIONE BAN
//----------------

/**
 * @swagger
 * /api/mod/users/{userId}/ban:
 *   post:
 *     summary: Applica una restrizione (ban temporaneo o permanente) sui commenti di un utente
 *     tags: [Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente nell'URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *             - targetUserId
 *             - durationDays
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 description: ID dell'utente da sanzionare (deve combaciare con l'id nel path)
 *                 example: 12
 *               durationDays:
 *                 type: integer
 *                 description: Durata in giorni del ban. Passare 0 per indicare un ban permanente.
 *                 example: 7
 *     responses:
 *       200:
 *         description: Utente bannato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utente bannato con successo fino al 05/06/2026"
 *       400:
 *         description: Richiesta malformata o tentativo di auto-ban
 *       403:
 *         description: Permessi insufficienti (tentativo di bannare lo staff)
 *       404:
 *         description: Utente target non trovato
 *       409:
 *         description: Conflitto di stato (L'utente resulta già essere sanzionato)
 *       500:
 *         description: Errore interno del server
 */

router.post('/users/:userId/ban', [
    body('targetUserId').isInt({ min: 1 }).notEmpty().withMessage("Id target non valido"),
    body('durationDays').isInt({ min: 0 }).notEmpty().withMessage("Durata non valida")
], modController.handleUserBan);

/**
 * @swagger
 * /api/mod/users/{userId}/unban:
 *   post:
 *     summary: Revoca la sanzione di ban e ripristina la facoltà di commentare ad un utente
 *     tags: [Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente da riabilitare nell'URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *             - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 description: ID dell'utente da sbannare
 *                 example: 12
 *     responses:
 *       200:
 *         description: Ban revocato e utente riabilitato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ban revocato con successo. L'utente può di nuovo commentare."
 *       400:
 *         description: Richiesta invalida o tentativo di sbloccare se stessi
 *       403:
 *         description: Azione non consentita su membri dello staff
 *       404:
 *         description: Utente non trovato
 *       409:
 *         description: Conflitto di stato (L'utente non è attualmente bannato)
 *       500:
 *         description: Errore interno del server
 */

router.post('/users/:userId/unban', [
    body('targetUserId').isInt({ min: 1 }).notEmpty().withMessage("Id target non valido"),
], modController.handleUserUnban);


module.exports = router;