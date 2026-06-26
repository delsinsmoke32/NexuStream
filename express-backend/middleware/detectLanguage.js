const detectLanguage = (req, res, next) => {
    // Lingue ufficialmente supportate
    const supportedLanguages = ['it', 'en', 'jp'];
    // Lingua di fallback se l'utente non ha l'header o usa una lingua non supportata
    const defaultLanguage = 'it'; 

    // Recuperiamo l'header Accept-Language
    const acceptLanguage = req.headers['accept-language'];

    if (!acceptLanguage) {
        req.language = defaultLanguage;
        return next();
    }

    if (acceptLanguage && supportedLanguages.includes(acceptLanguage.toLowerCase())) {
        req.language = acceptLanguage.toLowerCase();
    } else {
        // Fallback al parsing automatico del browser se non abbiamo una lingua forzata
        const browserLang = req.headers['accept-language']?.split(',')[0].split('-')[0].toLowerCase();
        req.language = supportedLanguages.includes(browserLang) ? browserLang : defaultLanguage;
    }

    next();
};

module.exports = detectLanguage;