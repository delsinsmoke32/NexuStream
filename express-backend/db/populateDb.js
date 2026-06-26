const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dbf = require("./db");
const db = dbf.db;

const populateDb = async () => {
    try {
        
        const sqlPath = path.join(__dirname, 'populateDb.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        try{
            db.serialize(() => {
                db.exec(sqlContent);
                console.log("Struttura base e catalogo anime inseriti.");
            });
        } catch (err) {
            console.error("L'errore è avvenuto dentro populateDb.sql!");
            console.error(err);
        }

        
        const users = [
            { email: 'admin@stream.it', pass: 'admin123', user: 'SuperAdmin', mod: 1, cat: 1, adm: 1, audio: 'jp', text: 'it', app: 'it', pic: 'avatars/avatar-000.png', canComment: 1 },
            { email: 'marco@email.com', pass: 'marco888', user: 'MarcoRossi', mod: 0, cat: 0, adm: 0, audio: 'it', text: 'it', app: 'it', pic: 'avatars/avatar-001.png', canComment: 1 },
            { email: 'gino@email.com', pass: 'gino9999', user: 'GinoRossi', mod: 1, cat: 0, adm: 0, audio: 'jp', text: 'it', app: 'it', pic: 'avatars/avatar-001.png', canComment: 1 },
            { email: 'guest@test.com', pass: 'guest999', user: 'GuestUser', mod: 0, cat: 1, adm: 0, audio: 'en', text: 'en', app: 'en', pic: 'avatars/avatar-002.png', canComment: 1 },
            
            
            { email: 'luigi@anime.it', pass: 'luigi999', user: 'LuigiOtaku', mod: 0, cat: 0, adm: 0, audio: 'jp', text: 'it', app: 'it', pic: 'avatars/avatar-002.png', canComment: 1 },
            { email: 'giulia@stream.it', pass: 'giulia22', user: 'GiuliaWeeb', mod: 0, cat: 0, adm: 0, audio: 'jp', text: 'it', app: 'it', pic: 'avatars/avatar-003.png', canComment: 1 },
            { email: 'hater@web.com', pass: 'hater123', user: 'AnimeHater', mod: 0, cat: 0, adm: 0, audio: 'it', text: 'it', app: 'it', pic: 'avatars/avatar-000.png', canComment: 0 } // Utente Bannato
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
    //  DATI DIPENDENTI 
    // ==========================================

    const commentsSql = `
            INSERT INTO "Comments" ("REF_UserID", "REF_DiscussionID", "DateCommented", "CommentText", "REF_CommentID", "isHidden", "Likes", "isApproved", "ReportCount") 
            VALUES 
            (2, 1, '2026-05-10 14:30', "Questa opening di Attack on Titan mi fa venire i brividi ogni volta!", NULL, 0, 45, 1, 0),
            (5, 1, '2026-05-10 15:00', "Assolutamente d'accordo, capolavoro indiscusso.", 1, 0, 12, 1, 0),
            
            (6, 3, '2026-05-12 18:22', "Gojo Satoru è semplicemente il miglior personaggio mai creato.", NULL, 0, 110, 1, 0),
            (7, 3, '2026-05-12 18:40', "Ma perfavore, è solo un anime sopravvalutato per ragazzini.", NULL, 0, 0, 1, 5),
            
            (2, 9, '2026-05-15 21:10', "Ho appena iniziato One Piece... ci vediamo tra 2 anni quando sarò in pari!", NULL, 0, 300, 1, 0),
            
            (5, 7, '2026-05-18 10:05', "L'animazione di Frieren è fuori di testa, lo studio Madhouse non delude mai.", NULL, 0, 85, 1, 0)
    `;

    const userInteractsEpisode = `
            INSERT INTO "LINKs_User_Interacts_Episode" ("REF_UserID", "REF_EpisodeID", "LastWatchedDate", "Progress", "isCompleted", "isDropped", "isLiked")
            VALUES 
            (2, 1, '2026-05-20 20:00', 100, 1, 0, 1),
            (2, 2, '2026-05-21 21:00', 45, 0, 0, 0),
            (2, 8, '2026-05-25 18:30', 80, 0, 0, 1), 
            
            (5, 3, '2026-05-28 14:15', 30, 0, 0, 1),
            (5, 9, '2026-05-29 16:00', 100, 1, 0, 1),
            (5, 10, '2026-05-30 22:45', 15, 0, 0, 0),

            (6, 12, '2026-05-22 19:10', 90, 0, 0, 1)
    `;

    const userLikesShow = `
            INSERT INTO "LINKs_User_Likes_Show" ("REF_UserID", "REF_ShowID") 
            VALUES 
            (2, 1), (2, 7), (2, 8),
            (5, 2), (5, 8), (5, 4),
            (6, 10), (6, 6)
    `;

    const userInteractsComment = `
            INSERT INTO "LINKs_User_Interacts_Comment" ("REF_CommentID", "REF_UserID", "isLiked", "isReported")
            VALUES
            (1, 5, 1, 0),
            (3, 2, 1, 0),
            (4, 1, 0, 1),
            (4, 2, 0, 1),
            (4, 5, 0, 1)
    `;

    try {
        console.log("Inserimento dei dati dipendenti (Commenti, Progressi, Preferiti)...");
        
        await dbf.runAsync(commentsSql, []);
        await dbf.runAsync(userInteractsEpisode, []);
        await dbf.runAsync(userLikesShow, []);
        await dbf.runAsync(userInteractsComment, []);

        console.log("Database interamente popolato!");
    } catch (err) {
        console.error("Errore nell'inserimento dei dati relazionali: ", err);
    }
}

module.exports = { populateDb };