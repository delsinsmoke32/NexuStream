require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const userRoute = require("./routes/user");
const homeRoute = require("./routes/home");
const adminRoute = require("./routes/adminPage");
const cataloguerRoute = require("./routes/cataloguerPage");
const showRoute = require("./routes/show");
const resetDb = require('./db/db').resetDb;
const db = require("./db/db").db;
const initDb = require("./db/db").initDb;
const populateDb = require("./db/populateDb").populateDb
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use('/api/login', loginRoute);
app.use('/api/register', registerRoute);
app.use('/api/users', userRoute);
app.use('/api/home', homeRoute);
app.use('/api/admin/users', adminRoute);
app.use('/api/cataloguer', cataloguerRoute);
app.use("/api/shows", showRoute);
app.use('/static', express.static(path.join(__dirname, 'public')));

BigInt.prototype.toJSON = function() { return this.toString() }; //fixgpt

resetDb();
initDb();
populateDb();

app.get('/', (req, res) => {
    res.send('Server attivo');
});

// app.get('/api/episodes', (req, res) => {
//     res.json([
//         {id: 4, title: 'Il più forte', duration: '24:00'},
//         {id: 5, title: 'End of Za Warudo', duration: '24:00'},
//     ]);
// });

//LASCIARE SEMPRE PER ULTIMA, ALTRIMENTI OGNI RICHIESTA DIVENTA 404
app.use((req, res) => {
    res.status(404).json({message: 'Pagina non trovata.'});
})


app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});