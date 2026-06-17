const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 🚀 IMPORTANTE: Aggiungi fs!
const { body } = require('express-validator');

// 1. FACTORY: Crea la configurazione di Storage in base alla cartella
const createStorage = (folderPath) => multer.diskStorage({
    destination: function (req, file, cb) {
        // 🚀 FIX: Creiamo il percorso assoluto e la cartella se non esiste
        const dir = path.join(__dirname, '../public', folderPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// 2. FACTORY: Crea l'istanza di Multer con i controlli di sicurezza
const createUploader = (folderPath) => multer({
    storage: createStorage(folderPath),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedExtensions = /jpeg|jpg|png|webp/;

        const isMimeValid = allowedMimeTypes.includes(file.mimetype);
        const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

        if (isMimeValid && isExtValid) {
            cb(null, true); 
        } else {
            cb(new multer.MulterError('FORMATO_NON_VALIDO'), false); 
        }
    }
});

// 3. FACTORY: Crea il validatore personalizzato (Il "Wrapper" di Express-Validator)
const createValidator = (folderPath, fieldName) => {
    const uploader = createUploader(folderPath);
    
    return body(fieldName).custom(async (value, { req }) => {
        await new Promise((resolve, reject) => {
            uploader.single(fieldName)(req, req.res, (err) => {
                if (err) {
                    if (err instanceof multer.MulterError && err.code === 'FORMATO_NON_VALIDO') {
                        return reject(new Error("Il file deve essere un'immagine valida (PNG, JPG, WEBP)"));
                    }
                    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                        return reject(new Error("Il file è troppo grande. Massimo 5MB."));
                    }
                    return reject(new Error(err.message));
                }
                resolve();
            });
        });
        return true;
    });
};

// ==========================================
// ESPORTIAMO I MIDDLEWARE PRONTI ALL'USO!
// ==========================================
module.exports = {
    // Single-Step per la rotta propic, visto che è molto più leggera
    validateAvatar: createValidator('avatars', 'img'),

    // Two-Step per le altre rotte, sono più pesanti
    uploadShowThumbnail: createUploader('show_thumbnails'),
    uploadShowBanner: createUploader('banners'),
    uploadEpisodeThumbnail: createUploader('episode_thumbnails')
};