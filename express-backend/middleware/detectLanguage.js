const detectLanguage = (req, res, next) => {
    // 1. Lingue ufficialmente supportate nel tuo initdb.sql
    const supportedLanguages = ['it', 'en', 'jp'];
    // Lingua di fallback se l'utente non ha l'header o usa una lingua non supportata
    const defaultLanguage = 'it'; 

    // 2. Recuperiamo l'header Accept-Language
    const acceptLanguage = req.headers['accept-language'];

    if (!acceptLanguage) {
        req.language = defaultLanguage;
        return next();
    }

    // 3. L'header può essere complesso (es. "it-IT,it;q=0.9,en;q=0.8")
    // Prendiamo la primissima scelta (es. "it-IT") e isoliamo il codice lingua ("it")
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase().trim();

    // 4. Se la lingua è supportata la usiamo, altrimenti andiamo di default
    req.language = supportedLanguages.includes(primaryLang) ? primaryLang : defaultLanguage;

    next();
};

module.exports = detectLanguage;