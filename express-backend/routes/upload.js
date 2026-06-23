const express = require('express');
const router = express.Router();
const isCataloguer = require('../middleware/isCataloguer');

// Importiamo le istanze di Multer dal tuo file config
const multerConfig = require('../middleware/multerConfig');
const { handleImageUpload, handleRawVideoUpload, handleTrackUpload } = require('../controllers/uploadController');

// Wrapper di sicurezza: cattura gli errori di Multer (es. file troppo grande o formato errato)
const catchMulterError = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    };
};

// ==========================================
// ROTTE UPLOAD IMMAGINI (TWO-STEP)
// ==========================================

// Attenzione al nome del campo dentro .single('nome_campo')! 
// È il nome esatto che si usa su Postman o su Angular nel FormData.

router.use(isCataloguer);

router.post('/show_thumbnails', catchMulterError(multerConfig.uploadShowThumbnail.single('thumbnail')), handleImageUpload);
router.post('/banners', catchMulterError(multerConfig.uploadShowBanner.single('banner')), handleImageUpload);
router.post('/episode_thumbnails', catchMulterError(multerConfig.uploadEpisodeThumbnail.single('thumbnail')), handleImageUpload);
router.post('/episodes/video/raw', catchMulterError(multerConfig.uploadRawVideo.single('video_file')), handleRawVideoUpload);
router.post('/episodes/track', catchMulterError(multerConfig.uploadMediaTrack.single('track')), handleTrackUpload);

module.exports = router;