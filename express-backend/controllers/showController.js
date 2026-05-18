const showModel = require('../models/showModel');
const { validationResult } = require('express-validator');

const search = async (req, res) => {
    // 1. Controllo errori di validazione formale
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const searchTerm = req.query.searchTerm;

    try {
        // 2. Prepariamo il parametro per la ricerca parziale (LIKE)
        const queryParam = `%${searchTerm}%`;

        // 3. Chiamata al Model
        const results = await showModel.searchShows(queryParam);
        
        return res.json(results);
    } catch (err) {
        console.error("Errore query ricerca: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const getHomeData = async (req, res) => {
    const user = req.user;

    try {
        // 1. Prepariamo le query base obbligatorie per tutti (anonimi e loggati)
        const promises = [
            showModel.getTopFavorited(),
            showModel.getTopStreamed()
        ];

        // 2. Se l'utente è loggato, aggiungiamo la promessa per il "Continua a guardare"
        if (user) {
            promises.push(showModel.getContinueWatching(user.id));
        }

        // 3. Eseguiamo tutto in parallelo
        const results = await Promise.all(promises);

        // 4. Costruiamo il JSON di risposta in modo sicuro
        const homeData = {
            topLiked: results[0],
            topViewed: results[1],
            // Se l'utente esiste i dati sono in results[2], altrimenti restituiamo un array vuoto
            continueWatching: user ? results[2] : [] 
        };

        return res.json(homeData);

    } catch (err) {
        console.error("Errore query homepage: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

module.exports = {
    search,
    getHomeData
};