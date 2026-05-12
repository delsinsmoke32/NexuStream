require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const episodeRoute = require("./routes/episode");
const commentsRoute = require("./routes/comments");
const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const userRoute = require("./routes/user");


const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use('/api/episode', episodeRoute);
app.use('/api/episode/:id/comments', commentsRoute);
app.use('/api/login', loginRoute);
app.use('/api/register', registerRoute);
app.use('/api/user', userRoute);

BigInt.prototype.toJSON = function() { return this.toString() }; //fixgpt

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