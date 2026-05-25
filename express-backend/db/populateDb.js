const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dbf = require("./db");
const db = dbf.db;

const populateDb = async () => {
    try {
        // 1. Eseguiamo il file SQL statico (Lingue, Serie, Episodi, Generi, Risoluzioni...)
        const sqlPath = path.join(__dirname, 'populateDb.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        try{
            db.serialize(() => {
                db.exec(sqlContent);
                console.log("Struttura base e dati statici inseriti.");
            });
        } catch (err) {
            console.error("L'errore è avvenuto dentro populateDb.sql!");
            console.error(err);
        }

        // 2. Inseriamo gli utenti (Tabella: Users)
        const users = [
            { email: 'admin@stream.it', pass: 'admin123', user: 'SuperAdmin', mod: 1, cat: 1, adm: 1, audio: 'it', text: 'it', app: 'it', pic: '/static/avatars/avatar-000.png', canComment: 1 },
            { email: 'marco@email.com', pass: 'marco88', user: 'MarcoRossi', mod: 0, cat: 0, adm: 0, audio: 'it', text: 'it', app: 'it', pic: '/static/avatars/avatar-001.png', canComment: 1 },
            { email: 'gino@email.com', pass: 'gino99', user: 'GinoRossi', mod: 1, cat: 0, adm: 0, audio: 'it', text: 'it', app: 'it', pic: '/static/avatars/avatar-001.png', canComment: 1 },
            { email: 'guest@test.com', pass: 'guest99', user: 'GuestUser', mod: 0, cat: 1, adm: 0, audio: 'en', text: 'en', app: 'en', pic: '/static/avatars/avatar-002.png', canComment: 1 }
        ];

        console.log("Hash delle password in corso...");

        for (const u of users) {
            const hash = bcrypt.hashSync(u.pass, 10);
            const sql = `INSERT INTO "Users" 
                ("Email", "Password", "Username", "isMod", "isCataloguer", "isAdmin", "REF_Audio_Language", "REF_Text_Language", "REF_App_Language", "REF_PropicURI", "canComment") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            await dbf.runAsync(sql, [u.email, hash, u.user, u.mod, u.cat, u.adm, u.audio, u.text, u.app, u.pic, u.canComment]);
        }

        console.log("Tutti gli utenti sono stati inseriti con successo.");

    } catch (error) {
        console.error("Errore durante la popolazione iniziale:", error);
        return;
    }

    // ==========================================
    // 3. DATI DIPENDENTI (Richiedono che gli utenti esistano)
    // ==========================================

    // Tabella: Comments (Incluso commento padre e risposta)
    const commentsSql = `
            INSERT INTO "Comments" ("REF_UserID", "REF_EpisodeID", "DateCommented", "CommentText", "REF_CommentID", "isHidden", "Likes", "isApproved", "ReportCount") 
            VALUES 
            (2, 1, '2023-05-10 14:30', "Questo primo episodio è stupendo!", NULL, 0, 10, 1, 0),
            (1, 1, '2023-05-10 15:00', "Concordo con te Marco!", 1, 0, 2, 1, 0),
            (3, 2, '2023-05-12 18:22', "Il secondo episodio si fa un po' lento.", NULL, 0, 1, 1, 1)
    `;

    // Tabella: LINKs_User_Interacts_Episode (Cronologia visiva e progressi)
    const userInteractsEpisode = `
            INSERT INTO "LINKs_User_Interacts_Episode" ("REF_UserID", "REF_EpisodeID", "LastWatchedDate", "Progress", "isCompleted", "isDropped", "isLiked")
            VALUES 
            (2, 1, '2023-06-01', 100, 1, 0, 1), -- Completato e piaciuto
            (2, 2, '2023-06-02', 45, 0, 0, 0),  -- In corso di visione
            (3, 1, '2023-06-02', 20, 0, 1, 0)   -- Droppato
    `;

    // Tabella: LINKs_User_Likes_Show (Preferiti delle Serie)
    const userLikesShow = `
            INSERT INTO "LINKs_User_Likes_Show" ("REF_UserID", "REF_ShowID") 
            VALUES 
            (2, 1), 
            (2, 2),
            (3, 2)
    `;

    // Tabella: LINKs_User_Interacts_Comment (Like e Segnalazioni ai Commenti)
    const userInteractsComment = `
            INSERT INTO "LINKs_User_Interacts_Comment" ("REF_CommentID", "REF_UserID", "isLiked", "isReported")
            VALUES
            (1, 2, 1, 0), -- Marco ha messo like al suo stesso commento
            (1, 3, 1, 0), -- Gino ha messo like al commento 1
            (3, 1, 0, 1)  -- Admin ha segnalato il commento 3
    `;

    try {
        console.log("Inserimento dei dati dipendenti e delle tabelle pivot...");
        
        await dbf.runAsync(commentsSql, []);
        await dbf.runAsync(userInteractsEpisode, []);
        await dbf.runAsync(userLikesShow, []);
        await dbf.runAsync(userInteractsComment, []);

        console.log("Database interamente popolato! Tutte le 19 tabelle hanno dati pronti.");
    } catch (err) {
        console.error("Errore nell'inserimento dei dati relazionali: ", err);
    }
}

module.exports = { populateDb };