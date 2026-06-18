const episodeModel = require('../models/episodeModel');
const { validationResult } = require('express-validator');
// TEMP per stream
require('dotenv').config();
const HOST = process.env.HOST || "localhost"
const PORT = process.env.PORT || 3000;

const getEpisodes = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    const { showId, seasonId } = req.params;
    const user = req.user;
    const applang = user ? user.appLang : req.language;
    let episodes = null;
    try {
        if (user) {
            episodes = await episodeModel.getEpisodesBySeasonAuth(req.user.id, seasonId, applang);
        } else {
            episodes = await episodeModel.getEpisodesBySeasonNoAuth(seasonId, applang);
        }
        return res.json(episodes);
    } catch (err) {
        console.error("Errore query episodi: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
}

const getEpisodeDetails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { episodeId } = req.params;
    const user = req.user;
    const applang = user ? user.appLang : req.language; 

    try {
        const episode = await episodeModel.getEpisodeById(episodeId, applang);

        if (!episode) {
            return res.status(404).json({ message: "Episodio non trovato." });
        }

        let userInteraction = null;
        
        // Se c'è un utente loggato, cerchiamo a che punto era arrivato e se aveva messo like
        if (user) {
            userInteraction = await episodeModel.getUserEpisodeInteraction(episodeId, user.id);
        }

        const response = {
            ...episode,
            DubLanguages: episode.DubLanguages ? episode.DubLanguages.split(',') : [],
            SubLanguages: episode.SubLanguages ? episode.SubLanguages.split(',') : [],
            // Iniettiamo i dati dell'utente (se esistono, altrimenti null o default)
            userInteraction: userInteraction || {
                Progress: 0,
                isCompleted: 0,
                isDropped: 0,
                isLiked: 0
            }
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

        // Se isLiked non viene mandato dal frontend, per sicurezza si usa quello vecchio
        const safeIsLiked = (isLiked !== undefined && isLiked !== null) ? isLiked : oldLiked;
        
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


const stream = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const episodeId = req.params.episodeId || req.params.id;
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    const baseUri = `http://${host}:${port}/static/videos/${episodeId}/`;

    const langNames = { 'it': 'Italiano', 'en': 'English', 'ja': 'Giapponese', 'es': 'Español' };

    try {
        // AGGIUNTO #EXT-X-INDEPENDENT-SEGMENTS per forzare l'avvio immediato senza blocchi sul timestamp 0
        let m3u8 = '#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-INDEPENDENT-SEGMENTS\n#EXT-X-START:TIME-OFFSET=0\n\n';

        const audios = await episodeModel.getEpisodeDubs(episodeId) || []; 
        const subtitles = await episodeModel.getEpisodeSubs(episodeId) || []; 

        // 2. Generazione Tracce Audio (DUB)
        if (audios.length > 0) {
            audios.forEach((audioObj, index) => {
                const langStr = typeof audioObj === 'string' ? audioObj : (audioObj.REF_LanguageID || audioObj.LanguageID || audioObj.lang || Object.values(audioObj)[0]);
                
                const isDefault = index === 0 ? 'YES' : 'NO'; 
                const langName = langNames[langStr] || langStr.toUpperCase();
                
                // AGGIUNTO CHARACTERISTICS="public.accessibility.describes-video" per legare stabilmente l'audio al video principale
                m3u8 += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${langName}",DEFAULT=${isDefault},AUTOSELECT=YES,LANGUAGE="${langStr}",CHARACTERISTICS="public.accessibility.describes-video",URI="${baseUri}audio_${langStr}/audio.m3u8"\n`;
            });
            m3u8 += '\n';
        }
        if (subtitles.length > 0) {
            subtitles.forEach(subObj => {
                const langStr = typeof subObj === 'string' ? subObj : (subObj.REF_LanguageID || subObj.LanguageID || subObj.lang || Object.values(subObj)[0]);
                const langName = langNames[langStr] || langStr.toUpperCase();
                
                // ORA PUNTA ALLA PLAYLIST SEGMENTATA (subs.m3u8) E NON AL FILE SINGOLO
                m3u8 += `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="${langName}",DEFAULT=NO,AUTOSELECT=YES,FORCED=NO,LANGUAGE="${langStr}",URI="${baseUri}subs_${langStr}/subs.m3u8"\n`;
            });
            m3u8 += '\n';
        }

        // 4. Flusso Video Principale
        let streamInf = '#EXT-X-STREAM-INF:BANDWIDTH=6000000';
        if (audios.length > 0) streamInf += ',AUDIO="audio"';
        if (subtitles.length > 0) streamInf += ',SUBTITLES="subs"';
        
        m3u8 += `${streamInf}\n`;
        m3u8 += `${baseUri}video/video.m3u8\n`;
        
        m3u8 += `${streamInf}\n`;
        m3u8 += `${baseUri}video/video.m3u8\n`;

        res.setHeader('Content-Type', 'application/x-mpegURL');
        return res.status(200).send(m3u8);

    } catch (err) {
        console.error("Errore generazione HLS:", err);
        return res.status(500).json({ error: "Errore durante la generazione dello stream" });
    }
};


module.exports = {
    getEpisodes,
    getEpisodeDetails,
    interactWithEpisode,
    stream
};