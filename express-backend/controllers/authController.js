const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const EmailService = require('../utils/emailService');
const rounds = 10; //round di hashing

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
        const user = await userModel.getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ message: "Email o password errati." });
        }

        // 3. Verifica della password
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch){
            return res.status(401).json({ message: "Email o password errati." });
        }

        // 4. Generazione del Token JWT
        const token = jwt.sign(
            { id: user.UserID, username: user.Username, isAdmin: user.isAdmin, isMod: user.isMod, isCat: user.isCataloguer, audioLang: user.REF_Audio_Language, textLang: user.REF_Text_Language, appLang: user.REF_App_Language},
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Risposta di successo (nascondendo la password)
        delete user.Password;
        return res.json({
            message: "Welcome back, " + user.Username,
            user,
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
    
    const { username, email, password, audioLanguageId, textLanguageId, appLanguageId, propicURI } = req.body;

    try {
        // 3. Hashing della password
        const hashedPassword = await bcrypt.hash(password, rounds);

        // 4. Chiamata al Model per l'inserimento
        const result = await userModel.createUser(username, email, hashedPassword, audioLanguageId, textLanguageId, appLanguageId, propicURI);

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

const forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {

    const user = await userModel.getUserByEmail(email);

    if (!user) {
        return res.json({ message: "Se l'email è presente nel sistema, riceverai un link di reset, valido per 15 minuti." });
    }

    const userId = user.UserID;

    const token = crypto.randomBytes(32).toString('hex');

    const result = await userModel.saveResetToken(userId, token);

    await EmailService.sendPasswordResetEmail(email, token);

    return res.json({ message: "Se l'email è presente nel sistema, riceverai un link di reset, valido per 15 minuti." })

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Errore interno del server.' });
    }

}

const resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    try {
        const isTokenValid = await userModel.validateResetToken(token);

        if (!isTokenValid) {
            return res.status(400).json({ message: "Il token di reset è invalido o scaduto." });
        }

        const userId = isTokenValid.REF_UserID;

        const hashedPassword = await bcrypt.hash(newPassword, rounds);

        await userModel.updatePassword(userId, hashedPassword);

        await userModel.deleteResetToken(token);

        return res.json({ message: "Password aggiornata con successo!" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Errore interno del server.' });
    }

}

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword
};