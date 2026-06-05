const commentModel = require('../models/commentModel');
const { validationResult } = require('express-validator');

const getDiscussionComments = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { discussionId } = req.params;
    const user = req.user;
    const isMod = !!(user && user.isMod);


    try {
        if (!user){
            return res.status(403).json({ message: "Devi essere autenticato per vedere i commenti!" });
        }
        const comments = await commentModel.getCommentsByDiscussion(discussionId, isMod, user.id);
        return res.json(comments);
    } catch (err) {
        console.error("Errore recupero commenti: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

const postComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { discussionId } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.user.id;

    try {
        const result = await commentModel.createComment(parentCommentId, userId, discussionId, text);
        return res.status(201).json({
            message: "Commento postato con successo!",
            commentId: result.id
        });
    } catch (err) {
        if (err && err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: "Impossibile postare il commento: riferimenti non validi." });
        }
        return res.status(500).json({ message: "Errore interno del server." });
    }
};

const interactWithComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { commentId } = req.params;
    const { isLiked, isReported } = req.body;
    const userId = req.user.id;

    try {
        const oldInteraction = await commentModel.getCommentInteraction(userId, commentId);

        const oldLiked = oldInteraction ? oldInteraction.isLiked : 0;
        const oldReported = oldInteraction ? oldInteraction.isReported : 0;

        const newLiked = isLiked !== undefined ? isLiked : oldLiked;
        const newReported = isReported !== undefined ? isReported : oldReported;

        // Calcoliamo di quanto devono variare i contatori totali (+1, -1 o 0)
        const likeDelta = newLiked - oldLiked;
        const reportDelta = newReported - oldReported;

        // 1. Salviamo l'interazione del singolo utente
        await commentModel.upsertCommentInteraction(commentId, userId, newLiked, newReported);
        
        // 2. Aggiorniamo il totale nel commento
        if (likeDelta !== 0 || reportDelta !== 0) {
            await commentModel.updateCommentStats(commentId, likeDelta, reportDelta);
        }
        
        return res.status(201).json({ message: "Interazione registrata!" });
    } catch (err) {
       if (err && err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: "Impossibile registrare l'interazione: riferimenti non validi." });
        }
        return res.status(500).json({ message: "Errore interno del server." });
    }
};

const hideComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { commentId } = req.params;
    const { isHidden } = req.body;

    try {
        await commentModel.updateHiddenStatus(commentId, isHidden);
        return res.json({ message: `Commento ${isHidden ? 'nascosto' : 'mostrato'} con successo.` });
    } catch (err) {
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

const approveComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { commentId } = req.params;
    const { isApproved } = req.body;

    try {
        await commentModel.updateApprovalStatus(commentId, isApproved);
        return res.json({ message: `Commento ${isApproved ? 'approvato' : 'non approvato'} con successo.` });
    } catch (err) {
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

module.exports = {
    getDiscussionComments,
    postComment,
    interactWithComment,
    hideComment,
    approveComment
};