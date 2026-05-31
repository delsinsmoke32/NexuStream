const episodeModel = require('../models/episodeModel');
const { validationResult } = require('express-validator');
// TEMP per stream
require('dotenv').config();
const HOST = process.env.HOST || "localhost"
const PORT = process.env.PORT || 3000;

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

const stream = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    let id = "test"
    let baseUri = `http://${HOST}:${PORT}/static/videos/${id}/`;
    const audios = [
        { name: 'Japanese (Original)', lang: 'jp', uri: 'audio1/audio1.m3u8', default: 'YES' },
        { name: 'English', lang: 'en', uri: 'audio2/audio2.m3u8', default: 'NO' }
    ];

    const subtitles = [
        { name: 'English', lang: 'en', uri: 'subs/subs1.m3u8' },
        { name: 'Japanese', lang: 'jp', uri: 'subs/subs2.m3u8' }
    ];

    let m3u8 = '#EXTM3U\n#EXT-X-VERSION:6\n\n';

    // Genera Audio
    audios.forEach(a => {
        m3u8 += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${a.name}",DEFAULT=${a.default},AUTOSELECT=YES,LANGUAGE="${a.lang}",URI="${baseUri+a.uri}"\n`;
    });
    m3u8 += '\n';

    // Genera Sottotitoli
    subtitles.forEach(s => {
        m3u8 += `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="${s.name}",DEFAULT=NO,AUTOSELECT=YES,FORCED=NO,LANGUAGE="${s.lang}",URI="${baseUri+s.uri}"\n`;
    });
    m3u8 += '\n';

    // Flusso Video principale
    m3u8 += '#EXT-X-STREAM-INF:BANDWIDTH=6000000,AUDIO="audio",SUBTITLES="subs"\n';
    m3u8 += baseUri+'video/video.m3u8';

    res.setHeader('Content-Type', 'application/x-mpegURL');
    return res.status(200).send(m3u8);
};

module.exports = {
    getEpisodeDetails,
    interactWithEpisode,
    stream
};