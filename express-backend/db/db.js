require('dotenv').config();
const sqlite3 = require("sqlite3").verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database("./db/nexustream.sqlite", (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite DB")
});

db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
    if (pragmaErr) {
        console.error("Errore nell'attivazione delle chiavi esterne:", pragmaErr.message);
    } else {
        console.log("Chiavi esterne attivate correttamente.");
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

const initDb = () => {
    try {
        const schemaPath = path.join(__dirname, 'initDb.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema);
        console.log("Database inizializzato correttamente.");
    } catch (error) {
        console.error("Errore durante l'inizializzazione del database:", error);
    }
};

const resetDb = () => {
    try {
        const dropPath = path.join(__dirname, 'resetDb.sql');
        const drop = fs.readFileSync(dropPath, 'utf8');

        db.exec(drop);
        console.log("Database droppato correttamente.");
    } catch (error) {
        console.error("Errore durante il drop del database:", error);
    }
}

module.exports = { db, initDb, resetDb, getAsync, runAsync };
