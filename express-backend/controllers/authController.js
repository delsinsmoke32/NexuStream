const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Gestisce la logica di login dell'utente.
 * @param {Object} req - La richiesta Express
 * @param {Object} res - La risposta Express
 */

const login = async (req, res) => {
    // 1. Controllo esito dei validatori del Router
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;

    try {
        // 2. Chiamata al Model per cercare l'utente
        const usr = await userModel.getUserByEmail(email);

        if (!usr) {
            return res.status(400).json({ message: "L'utente non esiste." });
        }

        // 3. Verifica della password
        const isMatch = await bcrypt.compare(password, usr.Password);
        if (!isMatch){
            return res.status(400).json({ message: "Email o password errati." });
        }

        // 4. Generazione del Token JWT
        const token = jwt.sign(
            { id: usr.UserID, username: usr.Username, isAdmin: usr.isAdmin, isMod: usr.isMod, isCat: usr.isCataloguer },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Risposta di successo (nascondendo la password)
        delete usr.Password;
        return res.json({
            message: "Welcome back, " + usr.Username,
            usr,
            token,
        });
        
    } catch (error) {
        if (error instanceof Error){
            console.error("Errore DB: ", error.message);
            return res.status(500).json({ error: error.message });
        } else {
            console.error("Errore sconosciuto, ma chi facisti?");
            return res.status(500).json({ message: "Errore imprevisto nel server." });
        }
    }
};

/**
 * Gestisce la logica di registrazione dell'utente.
 * @param {Object} req - La richiesta Express
 * @param {Object} res - La risposta Express
 */

const register = async (req, res) => {
    // 1. Controllo errori di validazione formale
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, username, conf_password, languageId, propicId } = req.body;

    // 2. Controllo logico della corrispondenza password
    if (password !== conf_password){
        return res.status(400).json({ message: "Le password non corrispondono." });
    }

    try {
        // 3. Hashing della password
        const rounds = 10;
        const hashedPassword = await bcrypt.hash(password, rounds);

        // 4. Chiamata al Model per l'inserimento
        const result = await userModel.createUser(username, email, hashedPassword, languageId, propicId);

        console.log("Utente creato con ID: ", result.id);
        return res.status(201).json({ message: "Registrazione completata!", userId: result.id });

    } catch (error) {
        console.error(error);
        if (error instanceof Error){
            // Gestione dell'errore di duplicazione (Email o Username già esistenti nel DB)
            if (error.message.includes("UNIQUE")){
                return res.status(400).json({ message: "Email o Username già in uso." });
            }
            return res.status(500).json({ message: "Errore durante la registrazione." });
        }
        return res.status(500).json({ message: "Errore sconosciuto nel server." });
    }
};

module.exports = {
    login,
    register
};