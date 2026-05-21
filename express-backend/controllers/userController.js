const userModel = require('../models/userModel');

const getMyProfile = async (req, res) => {
    try {
        // req.user viene iniettato dal middleware auth
        const uid = req.user.id;

        const user = await userModel.getUserProfileById(uid);

        if (!user) {
            return res.status(404).json({ message: "L'utente non esiste." });
        }
        
        return res.json(user);

    } catch (err) {
        console.error("Errore nel recupero del profilo: ", err);
        return res.status(500).json({ error: "Errore nel recupero del profilo." });
    }
};

const getGuestLanguage = (req) => {
    // Recupera l'header (es. "it-IT,it;q=0.9...")
    const acceptLang = req.headers['accept-language'];
    if (!acceptLang) return 'en'; // Fallback assoluto se manca l'header

    // Prende le prime due lettere (es. "it" o "en")
    const primaryLang = acceptLang.split(',')[0].split('-')[0];
    
    // Controlli se la lingua è tra quelle supportate dal tuo DB ('it', 'en', 'jp')
    const supported = ['it', 'en', 'jp'];
    return supported.includes(primaryLang) ? primaryLang : 'en'; 
};

module.exports = {
    getMyProfile,
    getGuestLanguage
};