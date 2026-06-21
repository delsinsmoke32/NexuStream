const path = require('path');

const handleImageUpload = (req, res) => {
    // Se Multer ha rifiutato il file (es. non è un'immagine), req.file sarà undefined
    if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato o formato non valido.' });
    }

    // Costruiamo il percorso relativo partendo dalla cartella 'public'
    // Usiamo .replace() per trasformare i backslash di Windows (\) negli slash del Web (/)
    const publicPath = path.relative(path.join(__dirname, '../public'), req.file.path).replace(/\\/g, '/');

    return res.status(200).json({
        message: 'Immagine caricata con successo!',
        uri: publicPath // Es: 'show_thumbnails/thumbnail-12345.jpg'
    });
};

const handleRawVideoUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Nessun video caricato o formato non valido." });
    }

    // Costruiamo il percorso relativo da salvare nel DB/passare ad addEpisode
    // Risultato es: 'videos/temp/raw_video_123456789.mp4'
    const videoURI = `videos/temp/${req.file.filename}`;
    
    return res.status(200).json({ 
        message: "Video raw caricato con successo nella cartella temporanea", 
        uri: videoURI 
    });
};

const handleTrackUpload = (req, res) => {
    // 1. Controllo di sicurezza: Multer ha fatto passare il file?
    if (!req.file) {
        return res.status(400).json({ error: "Nessun file traccia/sottotitolo caricato." });
    }

    // 2. Costruiamo il percorso relativo che il backend userà per trovare il file dopo
    // (Multer salva fisicamente in public/videos/temp, quindi il percorso relativo è questo)
    const fileUri = `videos/temp/${req.file.filename}`;

    // 3. Rispediamo al frontend!
    return res.status(200).json({ uri: fileUri });
};

module.exports = { 
    handleImageUpload,
    handleRawVideoUpload,
    handleTrackUpload
};