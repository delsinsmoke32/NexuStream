const episodeModel = require('../models/episodeModel');
const { validationResult } = require('express-validator');

const getEpisodeDetails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { episodeId } = req.params;

    try {
        const episode = await episodeModel.getEpisodeById(episodeId);

        if (!episode) {
            return res.status(404).json({ message: "Episodio non trovato." });
        }

        //Si trasformano Dub e Sub in array che json accetti
        const response = {
            ...episode,
            DubLanguages: episode.DubLanguages ? episode.DubLanguages.split(',') : [],
            SubLanguages: episode.SubLanguages ? episode.SubLanguages.split(',') : []
        };

        return res.json(response);

    } catch (err) {
        console.error("Errore query episodio: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const interactWithEpisode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { episodeId } = req.params;
    const { progress, isCompleted, isDropped, isLiked } = req.body;
    const userId = req.user.id;

    try {
        // 1. Recuperiamo lo stato del like precedente
        const oldInteraction = await episodeModel.getPreviousLikeStatus(episodeId, userId);
        const oldLiked = oldInteraction ? oldInteraction.isLiked : 0;
        
        // 2. Calcoliamo il delta (1, -1, o 0)
        const likeDelta = isLiked - oldLiked;

        // 3. Eseguiamo l'upsert dell'interazione
        await episodeModel.upsertEpisodeInteraction(userId, episodeId, progress, isCompleted, isDropped, isLiked);

        // 4. Se l'utente ha modificato il suo mi piace, aggiorniamo il totale dell'episodio
        if (likeDelta !== 0) {
            await episodeModel.updateEpisodeLikesCounter(likeDelta, episodeId);
        }
    
        return res.status(200).json({ 
            message: "Interazione memorizzata con successo!",
            likeDelta: likeDelta
        });

    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: "Impossibile interagire con l'episodio: riferimenti non validi." });
        }
        console.error("Errore salvataggio interazione: ", err);
        return res.status(500).json({ message: "Errore interno del server." });
    }
};

module.exports = {
    getEpisodeDetails,
    interactWithEpisode
};