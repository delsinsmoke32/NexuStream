const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// QUESTO FILE è DEPRECATO, i suoi contenuti si trovano ora in utils/videoProcessor
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================
// =================================================================================================================


// Crea la cartella di destinazione se non esiste
const outputDir = path.join(__dirname, '../public/videos/test_jjk/video');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const relativeOutputDir = 'public/videos/test_jjk/video';

const processVideo = (req, res) => {
    
    const inputVideo = path.join(__dirname, '../public/videos/test_jjk/jjk.mp4'); 

    const outputPlaylist = path.join(outputDir, 'video.m3u8');

    if (!fs.existsSync(inputVideo)) {
        return res.status(400).send('Video di input non trovato.');
    }

    // Configurazione del comando FFmpeg
    ffmpeg().input(inputVideo)
        .outputOptions([
            '-map 0:v:0',
            '-c:v libx264',
            '-f hls',
            '-hls_time 10',
            '-hls_segment_type fmp4',
            '-hls_playlist_type event',
            `-hls_fmp4_init_filename ./${relativeOutputDir}/init_v.mp4`, // Relativo alla cartella di output
            `-hls_segment_filename ./${relativeOutputDir}/v_%03d.m4s`     
        ])
        .output(outputPlaylist)
        .on('start', (commandLine) => {
            console.log('FFmpeg avviato con il comando: ' + commandLine);
        })
        .on('progress', (progress) => {
            console.log(`Elaborazione: ${progress.percent ? progress.percent.toFixed(2) : 0}% completato`);
        })
        .on('end', () => {
            console.log('Elaborazione completata con successo!');
            fs.readFile(outputPlaylist, 'utf8', (err, data) => {
                if (err) {
                    console.error('Errore nella lettura del file playlist:', err);
                    return res.status(500).send('Errore nella post-elaborazione.');
                }

                
                const regex = /#EXT-X-MAP:URI=".*init_v\.mp4"/g;
                const result = data.replace(regex, '#EXT-X-MAP:URI="init_v.mp4"');

                
                fs.writeFile(outputPlaylist, result, 'utf8', (err) => {
                    if (err) {
                        console.error('Errore nella scrittura del file playlist:', err);
                        return res.status(500).send('Errore nel salvataggio della playlist.');
                    }

                    console.log('Playlist modificata con successo!');
                    res.send('Video convertito e playlist ottimizzata!');
                });
            });
            
        })
        .on('error', (err) => {
            console.error('Errore durante l\'elaborazione:', err);
            res.status(500).send('Errore durante la conversione del video.');
        })
        .run();
}

module.exports = { processVideo }