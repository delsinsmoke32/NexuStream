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

module.exports = {
    getMyProfile
};