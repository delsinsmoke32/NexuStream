require('dotenv').config();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/database.sqlite", (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite DB")
});

db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
    if (pragmaErr) {
        console.error("Errore nell'attivazione delle chiavi esterne:", pragmaErr.message);
    } else {
        console.log("Foreign keys enabled successfully.");
    }
});
const getAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const runAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        // Uso function(err) invece di (err) => per mantenere il contesto 'this'
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                // 'this' contiene lastID (l'ID inserito) e changes (righe modificate)
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

db.pragma('foreign_keys = ON');

const initDb = () => {
    const schema = `
    CREATE TABLE IF NOT EXISTS "SupportedLanguages" (
        "LanguageID" TEXT PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Propics" (
        "PropicPath" TEXT PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Shows" (
        "ShowID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "DateStarted" INTEGER NOT NULL,
        "hasEnded" INTEGER NOT NULL,
        "DateEnded" TEXT NULL,
        "Favourited" INTEGER NOT NULL,
        "Description" TEXT NOT NULL,
        "Title" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Seasons" (
        "SeasonID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "REF_ShowID" INTEGER NOT NULL,
        "DateStarted" TEXT NOT NULL,
        "hasEnded" INTEGER NOT NULL,
        "DateEnded" TEXT NULL,
        "Description" TEXT NOT NULL,
        "Title" TEXT NOT NULL,
        FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID")
    );

    CREATE TABLE IF NOT EXISTS "Episodes" (
        "EpisodeID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ReleaseDate" TEXT NOT NULL,
        "REF_SeasonID" INTEGER NOT NULL,
        "Duration" INTEGER NOT NULL,
        "Likes" INTEGER NOT NULL,
        "Streams" INTEGER NOT NULL,
        "Description" TEXT NOT NULL,
        "Title" TEXT NOT NULL,
        FOREIGN KEY ("REF_SeasonID") REFERENCES "Seasons" ("SeasonID")
    );

    CREATE TABLE IF NOT EXISTS "Users" (
        "UserID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "Email" TEXT NOT NULL UNIQUE,
        "Password" TEXT NOT NULL,
        "Username" TEXT NOT NULL,
        "isMod" INTEGER NOT NULL,
        "isCataloguer" INTEGER NOT NULL,
        "isAdmin" INTEGER NOT NULL,
        "REF_LanguageID" TEXT NOT NULL,
        "REF_PropicID" TEXT NOT NULL,
        FOREIGN KEY ("REF_LanguageID") REFERENCES "SupportedLanguages" ("LanguageID"),
        FOREIGN KEY ("REF_PropicID") REFERENCES "Propics" ("PropicPath")
    );

    CREATE TABLE IF NOT EXISTS "Comments" (
        "CommentID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "REF_UserID" INTEGER NOT NULL,
        "REF_EpisodeID" INTEGER NOT NULL,
        "DateCommented" TEXT NOT NULL,
        "REF_CommentID" INTEGER NOT NULL,
        "isHidden" INTEGER NOT NULL,
        "Likes" INTEGER NOT NULL,
        "isApproved" INTEGER NOT NULL,
        FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
        FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID"),
        FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID")
    );

    CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Episode" (
        "REF_UserID" INTEGER NOT NULL,
        "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
        "LastWatchedDate" TEXT NOT NULL,
        "Progress" INTEGER NOT NULL,
        "isCompleted" INTEGER NOT NULL,
        "isDropped" INTEGER NOT NULL,
        "isLiked" INTEGER NOT NULL,
        FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
        FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
    );

    CREATE TABLE IF NOT EXISTS "LINKs_User_Likes_Show" (
        "REF_UserID" INTEGER NOT NULL,
        "REF_ShowID" INTEGER NOT NULL,
        PRIMARY KEY ("REF_UserID", "REF_ShowID"),
        FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
        FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID")
    );

    CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Comment" (
        "REF_CommentID" INTEGER NOT NULL,
        "REF_UserID" INTEGER NOT NULL,
        "isLiked" INTEGER NOT NULL,
        "isReported" INTEGER NOT NULL,
        PRIMARY KEY ("REF_CommentID", "REF_UserID"),
        FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID"),
        FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID")
    );

    CREATE TABLE IF NOT EXISTS "EpisodeLanguage" (
        "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
        "Language" TEXT NOT NULL,
        FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
    );

    CREATE TABLE IF NOT EXISTS "EpisodeTimes" (
        "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
        "StartTime" INTEGER NOT NULL,
        "EndTime" INTEGER NOT NULL,
        "Type" TEXT NOT NULL,
        FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
    );

    CREATE TABLE IF NOT EXISTS "EpisodeSub" (
        "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
        "Language" TEXT NOT NULL,
        FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
    );
    `;

    // Esegue tutto lo schema in una singola operazione
    db.exec(schema);
    console.log("Database inizializzato correttamente.");
};

const resetDb = () => {
    const drop = `
    -- Disabilita temporaneamente i vincoli se necessario (opzionale per SQLite)
    PRAGMA foreign_keys = OFF;

    -- Tabelle di collegamento (LINKs) e tabelle dipendenti
    DROP TABLE IF EXISTS "LINKs_User_Interacts_Comment";
    DROP TABLE IF EXISTS "LINKs_User_Likes_Show";
    DROP TABLE IF EXISTS "LINKs_User_Interacts_Episode";
    DROP TABLE IF EXISTS "Comments";
    DROP TABLE IF EXISTS "EpisodeLanguage";
    DROP TABLE IF EXISTS "EpisodeTimes";
    DROP TABLE IF EXISTS "EpisodeSub";
    DROP TABLE IF EXISTS "Episodes";
    DROP TABLE IF EXISTS "Seasons";

    -- Tabelle principali (Padri)
    DROP TABLE IF EXISTS "Users";
    DROP TABLE IF EXISTS "Shows";
    DROP TABLE IF EXISTS "Propics";
    DROP TABLE IF EXISTS "SupportedLanguages";

    -- Riabilita i vincoli
    PRAGMA foreign_keys = ON;
    `;

    db.exec(drop);
    console.log("Database droppato correttamente.");
}

module.exports = { db, initDb , getAsync, runAsync};
