require('dotenv').config();
const jwt = require('jsonwebtoken');
const auth = require('./auth');

module.exports = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        //L'utente non è autenticato/non è mod o admin, quindi semplicemente vede i commenti
        //in maniera normale
        return next();
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        //token scaduto o non valido, l'utente viene trattato come guest/utente
        //con privilegi minimi
        next();
    }
};