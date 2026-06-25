const userModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const getMyProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

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
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    // Recupera l'header (es. "it-IT,it;q=0.9...")
    const acceptLang = req.headers['accept-language'];
    if (!acceptLang) return 'en'; // Fallback assoluto se manca l'header

    // Prende le prime due lettere (es. "it" o "en")
    const primaryLang = acceptLang.split(',')[0].split('-')[0];
    
    // Controlli se la lingua è tra quelle supportate dal tuo DB ('it', 'en', 'jp')
    const supported = ['it', 'en', 'jp'];
    return supported.includes(primaryLang) ? primaryLang : 'en'; 
};

const getFavorites = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user;
    const applang = user ? user.appLang : req.language;

    try {
        if (!user) {
            return res.status(400).json({ message: "Bisogna essere autenticati per vedere i preferiti." });
        }
        const favorites = await userModel.getUserFavorites(req.user.id, applang);
        return res.json(favorites);
    } catch (err) {
        console.error("Errore nel recupero dei preferiti: ", err);
        return res.status(500).json({ error: "Errore nel recupero dei preferiti." });
    }
}

const bcrypt = require('bcrypt');

const modifyPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // Recuperato dal middleware di autenticazione

        // 2. Cerca l'utente nel database
        const user = await userModel.getUserPassword(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }
        // 3. Verifica la password attuale
        const isMatch = await bcrypt.compare(currentPassword, user["Password"]);
        if (!isMatch) {
            return res.status(400).json({ message: 'La password attuale non è corretta.' });
        }

        // 4. Cripta la nuova password e salva
        const salt = await bcrypt.genSalt(10);
        const newPassHash = await bcrypt.hash(newPassword, salt);
        await userModel.updatePassword(userId, newPassHash)

        return res.status(200).json({ message: 'Password aggiornata con successo.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Errore interno del server.' });
    }
}

const propicModel = require("../models/propicModel")

const modifyPropic = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        // const { newPropic } = req.body;
        const { propicURI } = req.body;
        const userId = req.user.id; // Recuperato dal middleware di autenticazione

        // 2. Cerca l'utente nel database
        const user = await userModel.getUserPassword(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }
        // check esistenza propic
        // .....
        await userModel.changePropic(userId, propicURI)

        return res.status(200).json({ message: 'Propic aggiornata con successo.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Errore interno del server.' });
    }
}

const changeLanguages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { appLanguageId, textLanguageId, audioLanguageId } = req.body;
    const user = req.user;

    try {
        await userModel.changeLanguages(user.id, appLanguageId, textLanguageId, audioLanguageId);
        return res.status(200).json({message: "Lingue cambiate con successo!"})
    } catch (err) {
         console.error(err);
        return res.status(500).json({ message: 'Errore interno del server.' });
    }
}


module.exports = {
    getMyProfile,
    getGuestLanguage,
    getFavorites,
    modifyPassword,
    modifyPropic,
    changeLanguages
};