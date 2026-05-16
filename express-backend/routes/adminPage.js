require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db");
const isAdmin = require("../middleware/isAdmin");

router.use(isAdmin);

//GET /api/admin/users
router.get('/', async (req, res) => {
    const {search, role} = req.query;
    let sql = `
        SELECT u.UserID, u.Username, u.Email, u.isMod, u.isCataloguer, u.isAdmin, u.REF_PropicID
        FROM Users AS u
        WHERE 1=1`;
    
    const params = [];

    //filtro 1: ricerca testuale (username, email)
    if (search) {
        sql += ` AND u.Username LIKE ? OR u.Email LIKE ?`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
    }

    //filtro 2: ricerca per ruolo (mod, cat, admin)
    if (role) {
        if (role === 'mod') {
            sql += ' AND u.isMod = 1';
        }
        if (role === 'cataloguer') {
            sql += ' AND u.isCataloguer = 1';
        }
        if (role === 'admin') {
            sql += ' AND u.isAdmin = 1';
        }
    }

    sql += ' ORDER BY u.Username ASC';

    try {
        const users = await dbf.allAsync(sql, params);
        res.json(users);
    } catch {
        console.error("Errore query admin: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});


//PATCH /api/admin/users/:id/roles
router.patch('/:id/roles', async (req, res) => {
    const uid = req.params.id;
    const { isMod, isCataloguer } = req.body;

    if (isMod === undefined && isCataloguer === undefined) {
        return res.status(401).json({message: "Fornire degli argomenti."});
    }

    let updateFields = [];
    let params = [];

    if (isMod !== undefined) {
        updateFields.push(`isMod = ?`);
        params.push(isMod ? 1 : 0);
    }
    if (isCataloguer !== undefined) {
        updateFields.push('isCataloguer = ?');
        params.push(isCataloguer ? 1 : 0);
    }

    params.push(uid);

    const sql = `UPDATE Users SET ${updateFields.join(', ')} WHERE Users.UserID = ?`;
    try{
        await dbf.runAsync(sql, params);
        res.json({message: "Ruoli aggiornati con successo!"});
    } catch (err) {
        console.error("Errore update ruoli: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;