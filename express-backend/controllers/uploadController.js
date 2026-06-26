const path = require('path');

const handleImageUpload = (req, res) => {
    // Se Multer ha rifiutato il file (es. non è un'immagine), req.file sarà undefined
    if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato o formato non valido.' });
    }

    // Costruiamo il percorso relativo partendo dalla cartella 'public'
    
    const publicPath = path.relative(path.join(__dirname, '../public'), req.file.path).replace(/\\/g, '/');

    return res.status(200).json({
        message: 'Immagine caricata con successo!',
        uri: publicPath 
    });
};

const handleRawVideoUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Nessun video caricato o formato non valido." });
    }

   
    const videoURI = `videos/temp/${req.file.filename}`;
    
    return res.status(200).json({ 
        message: "Video raw caricato con successo nella cartella temporanea", 
        uri: videoURI 
    });
};

const handleTrackUpload = (req, res) => {
    // Controllo di sicurezza
    if (!req.file) {
        return res.status(400).json({ error: "Nessun file traccia/sottotitolo caricato." });
    }

    // Costruiamo il percorso relativo che il backend userà per trovare il file dopo
    
    const fileUri = `videos/temp/${req.file.filename}`;

    
    return res.status(200).json({ uri: fileUri });
};

module.exports = { 
    handleImageUpload,
    handleRawVideoUpload,
    handleTrackUpload
};