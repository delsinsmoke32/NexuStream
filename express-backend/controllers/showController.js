const showModel = require('../models/showModel');
const userController = require('../controllers/userController');
const { validationResult } = require('express-validator');

const search = async (req, res) => {
    // 1. Controllo errori di validazione formale
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { q, genre } = req.query;

    try {
        // 2. Prepariamo il parametro per la ricerca parziale (LIKE)
        const searchParam = q ? `%${q}%` : '%';
        const genreParam = genre ? genre : null;

        // 3. Chiamata al Model
        const results = await showModel.searchShows(searchParam, genreParam);
        
        return res.json(results);
    } catch (err) {
        console.error("Errore query ricerca: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const getHomeData = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user;

    const applang = req.language;

    try {
        // 1. Prepariamo le query base obbligatorie per tutti (anonimi e loggati)
        const promises = [
            showModel.getTopFavorited(applang),
            showModel.getTopStreamed(applang)
        ];

        // 2. Se l'utente è loggato, aggiungiamo la promessa per il "Continua a guardare"
        if (user) {
            promises.push(showModel.getContinueWatching(user.id, applang));
        }

        // 3. Eseguiamo tutto in parallelo
        const results = await Promise.all(promises);

        // 4. Costruiamo il JSON di risposta in modo sicuro
        const homeData = {
            mostLiked: results[0],
            mostViewed: results[1],
            // Se l'utente esiste i dati sono in results[2], altrimenti restituiamo un array vuoto
            continueWatching: user ? results[2] : [] 
        };

        return res.json(homeData);

    } catch (err) {
        console.error("Errore query homepage: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const getShowDetails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { showId } = req.params;
    const user = req.user;
    const applang = req.language; 
    let show = null;


    try {

        if (req.user) {
            show = await showModel.getShowByIdAuth(req.user.id, showId, applang); //mostra anche i like
        } else {
            show = await showModel.getShowByIdNoAuth(showId, applang);
        }

        if (!show) return res.status(404).json({ error: "Show non trovato" });

        // 2. Aggiungiamo i Generi (trasformiamo [{Name: 'Action'}, {Name: 'Fantasy'}] in ['Action', 'Fantasy'])
        const genres = await showModel.getShowGenres(showId);
        show.genres = genres.map(g => g.Name); 

        // 3. Aggiungiamo Audio e Sottotitoli leggendoli dal primo episodio
        const firstEp = await showModel.getFirstEpisodeOfShow(showId);
        if (firstEp) {
            const audio = await showModel.getEpisodeAudio(firstEp.EpisodeID);
            const subs = await showModel.getEpisodeSubs(firstEp.EpisodeID);
            
            show.audio = audio.map(a => a.REF_LanguageID); // es. ['jp', 'it']
            show.subs = subs.map(s => s.REF_LanguageID);   // es. ['it', 'en']
        } else {
            show.audio = [];
            show.subs = [];
        }

        // Restituiamo l'oggetto completo!
        return res.json(show);
    } catch (err) {
        console.error("Errore recupero dettagli show: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const toggleShowLike = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { showId } = req.params;
    const userId = req.user.id;
    const { isLiked } = req.body;

    try {
        if (isLiked === 1) {
            // L'utente vuole mettere Like
            const result = await showModel.addLikeInteraction(userId, showId);

            // Aggiorna il contatore globale solo se la riga è stata effettivamente inserita ora
            if (result.changes > 0) {
                await showModel.incrementFavorites(showId);
            }

            return res.status(200).json({ message: "Serie aggiunta ai preferiti!", isLiked: 1 });
        } else {
            // L'utente vuole rimuovere il Like
            const result = await showModel.removeLikeInteraction(userId, showId);

            // Aggiorna il contatore globale solo se una riga è stata effettivamente eliminata
            if (result.changes > 0) {
                await showModel.decrementFavorites(showId);
            }

            return res.status(200).json({ message: "Serie rimossa dai preferiti!", isLiked: 0 });
        }
    } catch (err) {
        console.error("Errore gestione preferiti serie: ", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
};


module.exports = {
    search,
    getHomeData,
    getShowDetails,
    toggleShowLike
};