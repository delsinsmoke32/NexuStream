const adminModel = require('../models/adminModel');
const { validationResult } = require('express-validator');

const getUsersList = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { search, role } = req.query;

    try {
        const users = await adminModel.filterUsers(search, role);
        return res.json(users);
    } catch (err) {
        console.error("Errore query admin users: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

const updateRoles = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const uid = req.params.id;
    const { isMod, isCataloguer } = req.body;

    
    if (isMod === undefined && isCataloguer === undefined) {
        return res.status(400).json({ message: "Fornire almeno un argomento da modificare (isMod o isCataloguer)." });
    }

    try {
        await adminModel.updateUserRoles(uid, isMod, isCataloguer);
        return res.json({ message: "Ruoli aggiornati con successo!" });
    } catch (err) {
        console.error("Errore update ruoli: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
};

module.exports = {
    getUsersList,
    updateRoles
};