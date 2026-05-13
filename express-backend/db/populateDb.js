const dbf = require("./db")
db = dbf.db;

const populateDb = () => {
    try {
        const dataPath = path.join(__dirname, 'populateDb.sql');
        const data = fs.readFileSync(data, 'utf8');

        db.exec(data);
        console.log("Database popolato correttamente.");
    } catch (error) {
        console.error("Errore durante la popolazione del database:", error);
    }
}

module.exports = { populateDb };