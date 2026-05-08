const express = require('express');
const app = express();
const cors = require('cors');
const episodeRoutes = require("./routes/episodes");


const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use('/api/episodes', episodeRoutes);

app.get('/', (req, res) => {
    res.send('Server attivo');
});

/*app.get('/api/episodes', (req, res) => {
    res.json([
        {id: 4, title: 'Il più forte', duration: '24:00'},
        {id: 5, title: 'End of Za Warudo', duration: '24:00'},
    ]);
});
*/
//LASCIARE SEMPRE PER ULTIMA, ALTRIMENTI OGNI RICHIESTA DIVENTA 404
app.use((req, res) => {
    res.status(404).json({message: 'Pagina non trovata.'});
})


app.listen(PORT, () => {
console.log(`Server in ascolto su http://localhost:${PORT}`);
});