const multer = require('multer');
const path = require('path'); // Richiesto per path.extname

// Configurazione dello storage per preservare nome ed estensione
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specifica la cartella dove salvare i file (creala se non esiste)
        cb(null, 'public/avatars/');
    },
    filename: function (req, file, cb) {
        // Genera un nome univoco combinando timestamp attuale e un numero casuale
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        // Recupera l'estensione del file originale (es: .jpg, .png)
        const ext = path.extname(file.originalname);
        
        // Imposta il nome definitivo del file comprensivo di estensione
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const { body } = require('express-validator');

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: (req, file, cb) => {
        // 1. Definisci i formati accettati
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedExtensions = /jpeg|jpg|png|webp/;

        // 2. Controlla sia il Mime Type che l'estensione del nome file
        const isMimeValid = allowedMimeTypes.includes(file.mimetype);
        const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

        if (isMimeValid && isExtValid) {
            // Accetta il file: Multer inizierà a salvarlo sul disco
            cb(null, true); 
        } else {
            // Rifiuta il file: interrompe immediatamente l'upload e passa l'errore al controller
            cb(new multer.MulterError('FORMATO_NON_VALIDO'), false); 
        }
    }
})

const validateAvatar = body('img').custom(async (value, { req }) => {
    // Avvolgiamo Multer in una Promise per integrarlo nel flusso asincrono
    await new Promise((resolve, reject) => {
        uploadAvatar.single('img')(req, req.res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'FORMATO_NON_VALIDO') {
                    return reject(new Error("Il file caricato deve essere un'immagine valida (PNG, JPG, WEBP)"));
                }
                if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    return reject(new Error("Il file è troppo grande. Massimo 5MB."));
                }
                return reject(new Error(err.message));
            }
            console.log("Avatar salvato con successo")
            resolve();
        });
    });
    
    return true;
});

module.exports = {
    validateAvatar
}