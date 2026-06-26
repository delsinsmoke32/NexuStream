const multer = require('multer');
const path = require('path');
const fs = require('fs'); //  IMPORTANTE: Aggiungi fs!
const { body } = require('express-validator');

// FACTORY: Crea la configurazione di Storage in base alla cartella
const createStorage = (folderPath) => multer.diskStorage({
    destination: function (req, file, cb) {
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

// FACTORY: Crea l'istanza di Multer con i controlli di sicurezza
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

// FACTORY: Crea il validatore personalizzato 
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

// Creiamo la cartella temporanea se non esiste
const tempVideoDir = path.join(__dirname, '../public/videos/temp');
if (!fs.existsSync(tempVideoDir)) {
    fs.mkdirSync(tempVideoDir, { recursive: true });
}

// Storage dedicato ai video raw
const rawVideoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempVideoDir);
    },
    filename: function (req, file, cb) {
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `raw_video_${uniqueSuffix}${ext}`);
    }
});

const uploadRawVideo = multer({ 
    storage: rawVideoStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        // Accettiamo solo file video (MP4, MKV, ecc.)
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Il file caricato non è un video valido.'), false);
        }
    }
});

// ==========================================
// STORAGE PER AUDIO E SOTTOTITOLI (TEMP)
// ==========================================
const mediaTrackStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempVideoDir); // Usiamo la stessa cartella temp del video
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `track_${uniqueSuffix}${ext}`);
    }
});

const uploadMediaTrack = multer({ 
    storage: mediaTrackStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        const isAudio = file.mimetype.startsWith('audio/'); 
        
        
        const isMp3 = file.originalname.endsWith('.mp3') || file.mimetype === 'audio/mpeg';
        const isSub = file.mimetype === 'text/vtt' || file.originalname.endsWith('.vtt') || file.originalname.endsWith('.srt');
        
        if (isAudio || isMp3 || isSub) {
            cb(null, true);
        } else {
            cb(new Error('Il file caricato deve essere un audio (.mp3, .aac) o un sottotitolo (.vtt, .srt).'), false);
        }
    }
});


module.exports = {
    // Single-Step per la rotta propic, visto che è molto più leggera
    validateAvatar: createValidator('avatars', 'img'),

    // Two-Step per le altre rotte, sono più pesanti
    uploadShowThumbnail: createUploader('show_thumbnails'),
    uploadShowBanner: createUploader('banners'),
    uploadEpisodeThumbnail: createUploader('episode_thumbnails'),
    uploadRawVideo,
    uploadMediaTrack
};