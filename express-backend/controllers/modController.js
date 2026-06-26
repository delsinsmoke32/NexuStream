const modModel = require('../models/modModel');
const commentModel = require('../models/commentModel');
const { validationResult } = require('express-validator');

//-----------------------
// GESTIONE DISCUSSIONI
//-----------------------

// GET - Prende discussioni in base all'episodio, o tutte se non ci sono filtri
const getDiscussions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { showClosed, search } = req.query;
    try {
        const discussions = await modModel.getDiscussions(showClosed, search);
        return res.json(discussions);
    } catch (err) {
        console.error("Errore recupero discussioni: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// POST - Creazione discussione
const createDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { REF_EpisodeID, closeDate, type } = req.body;
    // Generiamo automaticamente la data di apertura in formato ISO string o simile locale
    const openDate = new Date().toISOString().replace('T', ' ').substring(0, 16); 

    try {
        const result = await modModel.createDiscussion({ REF_EpisodeID, openDate, closeDate, type });
        return res.status(201).json({ message: "Discussione creata con successo.", discussionId: result.lastID });
    } catch (err) {
        console.error("Errore creazione discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// PATCH - Modifica parziale (ForceClosed, CloseDate)
const updateDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { discussionId } = req.params;
    const { closeDate, forceClosed, type } = req.body;

    try {
        const changes = await modModel.updateDiscussion(discussionId, { closeDate, forceClosed, type });
        if (changes === 0) {
            return res.status(404).json({ message: "Discussione non trovata o nessuna modifica effettuata." });
        }
        return res.json({ message: "Discussione aggiornata con successo." });
    } catch (err) {
        console.error("Errore aggiornamento discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

// DELETE - Cancellazione a cascata
const deleteDiscussion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { discussionId } = req.params;

    try {
        const changes = await modModel.deleteDiscussion(discussionId);
        if (changes === 0) {
            return res.status(404).json({ message: "Discussione non trovata." });
        }
        return res.json({ message: "Discussione eliminata con successo." });
    } catch (err) {
        console.error("Errore eliminazione discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

//-----------------------
// GESTIONE UTENTI
//-----------------------

const getUsersList = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { search } = req.query;

    const page = parseInt(req.query.page) || 1; //quale pagina di utenti da caricare, le pagine sono blocchi di dimensione limit
    const limit = parseInt(req.query.limit) || 50;

    const offset = (page - 1) * limit; //offset calcolato
    
    try {
        const users = await modModel.filterUsers(search, offset, limit);
        return res.json(users);
    } catch (err) {
        console.error("Errore query mod users: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
}

const getUserComments = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { userId } = req.params;

    try {
        const comments = await modModel.getUserCommentsById(userId);
        return res.json(comments);
    } catch (err) {
        console.error("Errore query mod users: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
}

// Non vengono usati direttamente i controller del comment controller per hide e approve perchè
// richiedono per via di express validator anche gli id di show, season ed episode,
// nonchè di discussion. Visto che sono funzioni corte, vengono riportate qui
// per consistency generale, ma i model vengono riutilizzati visto che sono
// compatibili con quello che si deve fare.

const hideComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }
    const { commentId } = req.params;
    const { isHidden } = req.body;

    try {
        await commentModel.updateHiddenStatus(commentId, isHidden);
        return res.json({ message: `Commento ${isHidden ? 'nascosto' : 'mostrato'} con successo.` });
    } catch (err) {
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
}

const approveComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }
    const { commentId } = req.params;
    const { isApproved } = req.body;

    try {
        await commentModel.updateApprovalStatus(commentId, isApproved);
        return res.json({ message: `Commento ${isApproved ? 'approvato' : 'non approvato'} con successo.` });
    } catch (err) {
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
}

//----------------
// GESTIONE BAN
//----------------

const handleUserBan = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    };

    const { targetUserId, durationDays } = req.body;
    const moderatorId = req.user.id;

    try {
        if (parseInt(targetUserId) === parseInt(moderatorId)) {
            return res.status(400).json({ error: "Non puoi bannare te stesso." });
        }

        // Check dei permessi dell'utente, also se al momento è bannato
        const targetUser = await modModel.getTargetUserStatus(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        if (targetUser.isAdmin || targetUser.isMod || targetUser.isCataloguer) {
            return res.status(403).json({ error: "Non puoi bannare un membro dello staff." });
        }

        if (!targetUser.canComment) {
            // Il ban ha una scadenza memorizzata
            if (targetUser.BannedUntil) {
                const expireDate = new Date(targetUser.BannedUntil);
                const now = new Date();

                if (expireDate > now) {
                    return res.status(409).json({ error: "L'utente è già bannato a tempo." });
                } 
            } else {
                return res.status(409).json({ error: "L'utente è già bannato indefinitamente." });
            }
        }

        let bannedUntil = null;
        if (durationDays && parseInt(durationDays) > 0) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(durationDays));
            bannedUntil = date.toISOString();
        }

        // Utilizzo del modModel per eseguire l'aggiornamento
        await modModel.banUser(targetUserId, bannedUntil);

        return res.json({ 
            message: bannedUntil 
                ? `Utente bannato con successo fino al ${new Date(bannedUntil).toLocaleDateString()}`
                : "Utente bannato a tempo indefinito." 
        });

    } catch (err) {
        console.error("Errore nel controller di moderazione:", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
};

const handleUserUnban = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() })
    }

    const { targetUserId } = req.body;
    const moderatorId = req.user.id;

    try {
        if (parseInt(targetUserId) === parseInt(moderatorId)) {
            return res.status(400).json({ error: "Non puoi sbannare te stesso." });
        }

        // Check dei permessi dell'utente, also se al momento è bannato
        const targetUser = await modModel.getTargetUserStatus(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        if (targetUser.isAdmin || targetUser.isMod || targetUser.isCataloguer) {
            return res.status(403).json({ error: "Non puoi sbannare un membro dello staff." });
        }

        if (targetUser.canComment) {
            return res.status(409).json({ error: "L'utente non è bannato." });
        }

        await modModel.unbanUser(targetUserId);

        return res.json({ message: "L'utente è stato sbannato!" });

    } catch (err) {
        console.error("Errore nel controller di moderazione:", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
}   

module.exports = {
    getDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    getUsersList,
    getUserComments,
    hideComment,
    approveComment,
    handleUserBan,
    handleUserUnban
};