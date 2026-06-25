const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Trasforma un video raw (MP4/MKV) in un flusso HLS con segmenti fMP4.
 * @param {string} inputFilePath - Percorso del file video temporaneo
 * @param {string} episodeURI - ID dell'episodio (usato per nominare la cartella)
 * @returns {Promise<string>} - Risolve con il percorso della cartella creata
 */
const processVideoHLS = (inputFilePath, episodeURI) => {
    return new Promise((resolve, reject) => {
        // 1. Definiamo le cartelle di destinazione
        // Es: public/videos/1/video/
        const baseOutputDir = path.join(__dirname, '../public/videos', String(episodeURI));
        const videoOutputDir = path.join(baseOutputDir, 'video');

        // Creiamo la cartella in modo sincrono se non esiste
        if (!fsSync.existsSync(videoOutputDir)) {
            fsSync.mkdirSync(videoOutputDir, { recursive: true });
        }

        const m3u8OutputPath = path.join(videoOutputDir, 'video.m3u8');

        console.log(`Inizio transcodifica HLS per Episodio ${episodeURI}...`);

        // 2. Avviamo FFmpeg
        ffmpeg(inputFilePath)
            // Codifica video base (H.264) e audio (AAC)
            .videoCodec('libx264')
            .audioCodec('aac')
            .addOutputOption('-avoid_negative_ts', 'make_zero') // Riga sotto
            .addOutputOption('-fflags', '+genpts') // Azzera il tempo internamente ai segmenti, rendendo il buffer di partenza identico per tutti i flussi
            .outputOptions([
                '-map 0:v:0', // Prende la prima traccia video (ignora le altre)
                '-map 0:a:0?', // Prende la prima traccia audio se esiste (ignora le altre)
                '-profile:v', 'main', // Profilo di compatibilità standard
                '-crf', '20', // Constant Rate Factor (Qualità visiva bilanciata)
                '-preset', 'fast', // Velocità di elaborazione (utile per non aspettare troppo)
                '-hls_time', '10', // Durata di ogni segmento (10 secondi)
                '-hls_playlist_type', 'vod', // Video On Demand (Playlist statica)
                '-hls_segment_type', 'fmp4', // Usa fMP4 invece del vecchio formato .ts
                '-hls_segment_filename', path.join(videoOutputDir, 'segment_%03d.m4s'), // Nomi dei segmenti
                '-hls_fmp4_init_filename', path.join(videoOutputDir, 'init_v.mp4'), // Il file di inizializzazione
                '-hls_flags', 'independent_segments',
                '-max_muxing_queue_size', '1024'
            ])
            .output(m3u8OutputPath)
            .on('end', async () => {
                console.log(`Transcodifica completata per Episodio ${episodeURI}!`);
                
                // FIX: Puliamo il percorso di init_v.mp4 nel file M3U8
                try {
                    // 1. Legge il file m3u8
                    let playlistData = await fs.readFile(m3u8OutputPath, 'utf8');
                    
                    // 2. Cerca qualsiasi percorso strano prima di init_v.mp4 e lo rimuove
                    const regex = /#EXT-X-MAP:URI=".*init_v\.mp4"/g;
                    playlistData = playlistData.replace(regex, '#EXT-X-MAP:URI="init_v.mp4"');
                    
                    // 3. Sovrascrive il file pulito
                    await fs.writeFile(m3u8OutputPath, playlistData, 'utf8');
                    
                    console.log(`Playlist ottimizzata per Episodio ${episodeURI}.`);
                    resolve(baseOutputDir);
                } catch (err) {
                    console.error("Errore durante la pulizia della playlist:", err);
                    reject(err);
                }
            })
            .on('error', (err) => {
                console.error(`Errore FFmpeg sull'Episodio ${episodeURI}:`, err.message);
                reject(err);
            })
            .run();
    });
};

/**
 * Sposta i file audio/sub temporanei nelle cartelle HLS definitive.
 * @param {string} tempFilePath - Percorso del file caricato
 * @param {string} episodeURI - ID dell'episodio
 * @param {string} type - 'audio' o 'subs'
 * @param {string} lang - Es: 'it', 'en'
 */
const moveMediaFile = async (tempFilePath, episodeURI, type, lang) => {
    const baseDir = path.join(__dirname, '../public/videos', String(episodeURI));
    
    if (type === 'audio') {
        const targetDir = path.join(baseDir, `audio_${lang}`);
        if (!fsSync.existsSync(targetDir)) {
            fsSync.mkdirSync(targetDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            // FIX DEFINITIVO: Usiamo fmp4 anche per l'audio, con init_a.mp4
            // Notare come scriviamo solo i nomi dei file, perché Node lavorerà già dentro targetDir!
            const command = `ffmpeg -i "${tempFilePath}" -c:a aac -b:a 192k -avoid_negative_ts make_zero -fflags +genpts -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "audio_%03d.m4s" -hls_fmp4_init_filename "init_a.mp4" "audio.m3u8"`;
            
            // ✅ Eseguiamo il comando impostando la cartella di lavoro (cwd) su targetDir
            exec(command, { cwd: targetDir }, async (err) => {
                if (err) {
                    console.error("[FFMPEG AUDIO] Errore segmentazione:", err);
                    return reject(err);
                }
                await fs.unlink(tempFilePath).catch(() => {});
                console.log(`[FFMPEG AUDIO] Traccia ${lang} segmentata in fMP4 HLS con successo!`);
                // Risolviamo restituendo il percorso assoluto che si aspetta il resto del codice
                resolve(path.join(targetDir, 'audio.m3u8'));
            });
        });
    } else if (type === 'subs') {
        // Creiamo una cartella dedicata per i sottotitoli segmentati
        const targetDir = path.join(baseDir, `subs_${lang}`);
        if (!fsSync.existsSync(targetDir)) {
            fsSync.mkdirSync(targetDir, { recursive: true });
        }

        const outputPlaylist = path.join(targetDir, 'subs.m3u8');
        const outputSegments = path.join(targetDir, 'sub_%03d.vtt'); // FFmpeg chiamerà i file sub_000.vtt, sub_001.vtt ecc.

        // Segmentiamo il VTT in pezzi da 10 secondi!
        return new Promise((resolve, reject) => {
            const command = `ffmpeg -i "${tempFilePath}" -c:s copy -f segment -segment_time 10 -segment_list "${outputPlaylist}" "${outputSegments}"`;
            
            exec(command, async (err) => {
                if (err) {
                    console.error("[FFMPEG SUBS] Errore segmentazione sottotitoli:", err);
                    return reject(err);
                }
                // Pulizia del file .vtt temporaneo
                await fs.unlink(tempFilePath).catch(() => {});
                console.log(`[FFMPEG SUBS] Sottotitolo ${lang} segmentato in HLS con successo!`);
                resolve(outputPlaylist);
            });
        });
    }
};

module.exports = {
    processVideoHLS,
    moveMediaFile
};