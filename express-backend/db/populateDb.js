const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dbf = require("./db");
const db = dbf.db;

const populateDb = async () => {
    try {
        // 1. Eseguiamo il file SQL per le tabelle base (Serie, Episodi, ecc.)
        const sqlPath = path.join(__dirname, 'populateDb.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // db.exec è sincrono in sqlite3, ma lo mettiamo in un blocco pulito
        db.serialize(() => {
            db.exec(sqlContent);
            console.log("Struttura base e dati statici inseriti.");
        });

        //Definiamo gli utenti in un array
        const users = [
            { email: 'admin@stream.it', pass: 'admin123', user: 'SuperAdmin', mod: 1, cat: 1, adm: 1, lang: 'it', pic: '/static/avatars/avatar-000.png' },
            { email: 'marco@email.com', pass: 'marco88', user: 'MarcoRossi', mod: 0, cat: 0, adm: 0, lang: 'it', pic: '/static/avatars/avatar-001.png' },
            { email: 'gino@email.com', pass: 'gino99', user: 'GinoRossi', mod: 1, cat: 0, adm: 0, lang: 'it', pic: '/static/avatars/avatar-001.png' },
            { email: 'guest@test.com', pass: 'guest99', user: 'GuestUser', mod: 0, cat: 1, adm: 0, lang: 'en', pic: '/static/avatars/avatar-002.png' }
        ];

        console.log("Hash delle password in corso...");

        //Inseriamo gli utenti uno per uno con password hashata
        for (const u of users) {
            const hash = bcrypt.hashSync(u.pass, 10);
            const sql = `INSERT INTO "Users" 
                ("Email", "Password", "Username", "isMod", "isCataloguer", "isAdmin", "REF_LanguageID", "REF_PropicID") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            // Usiamo runAsync per gestire l'asincronia
            await dbf.runAsync(sql, [u.email, hash, u.user, u.mod, u.cat, u.adm, u.lang, u.pic]);
        }

        console.log("Tutti gli utenti sono stati inseriti con password sicure.");

    } catch (error) {
        console.error("Errore durante la popolazione utenti:", error);
    }

    const commentsSql = `
            INSERT INTO "Comments" ("REF_UserID", "REF_EpisodeID", "DateCommented", "REF_CommentID", "isHidden", "Likes", "isApproved") 
            VALUES 
            (2, 1, '2023-05-10 14:30', 1, 0, 10, 1),
            (1, 1, '2023-05-10 15:00', 1, 0, 2, 1)
    `;

    const userInteractsEpisode = `INSERT INTO "LINKs_User_Interacts_Episode" ("REF_UserID", "REF_EpisodeID", "LastWatchedDate", "Progress", "isCompleted", "isDropped", "isLiked")
            VALUES 
            (2, 1, '2023-06-01', 100, 1, 0, 1),
            (3, 1, '2023-06-02', 20, 0, 1, 0)
    `;

    const userLikesShow = `INSERT INTO "LINKs_User_Likes_Show" ("REF_UserID", "REF_ShowID") VALUES (2, 1), (2, 2)`;

    try {
        await dbf.runAsync(commentsSql, []);
        await dbf.runAsync(userInteractsEpisode, []);
        await dbf.runAsync(userLikesShow, []);

        console.log("Inseriti con successo i dati dipendenti!");
    } catch (err) {
        console.error("Errore nell'inserimento dei dati dipendenti: ", err);
    }
}

module.exports = { populateDb };