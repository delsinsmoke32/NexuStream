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

module.exports = { handleImageUpload };