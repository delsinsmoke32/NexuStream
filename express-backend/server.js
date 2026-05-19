require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const userRoute = require("./routes/user");
const homeRoute = require("./routes/home");
const searchRoute = require("./routes/search");
const adminRoute = require("./routes/adminPage");
const cataloguerRoute = require("./routes/cataloguerPage");
const showRoute = require("./routes/show");
const resetDb = require('./db/db').resetDb;
const db = require("./db/db").db;
const initDb = require("./db/db").initDb;
const populateDb = require("./db/populateDb").populateDb
const fs = require('fs');
const path = require('path');

// Configurazione di Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'NexuStream API',
            version: '1.0.0',
            description: 'Documentazione ufficiale del backend di NexuStream',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT', // Specifichiamo che è un token JWT
                    description: "Inserisci il tuo token JWT qui sotto per autenticarti."
                }
            }
        },
    },
    // Indica a swagger-jsdoc dove andare a cercare i commenti @swagger
    apis: ['./routes/*.js', './controllers/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use('/api/login', loginRoute);
app.use('/api/register', registerRoute);
app.use('/api/users', userRoute);
app.use('/api/home', homeRoute);
app.use('/api/search', searchRoute);
app.use('/api/admin/users', adminRoute);
app.use('/api/cataloguer', cataloguerRoute);
app.use("/api/shows", showRoute);
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// app.use('/static/videos', (req, res, next) => {
//   if (req.path.endsWith('.m4s')) {
//     res.set('Content-Type', 'video/iso.segment');
//   } else if (req.path.endsWith('.mp4')) {
//     res.set('Content-Type', 'video/mp4');
//   } else if (req.path.endsWith('.m3u8')) {
//     res.set('Content-Type', 'application/x-mpegURL');
//   }
//   next();
// }, express.static('public/videos'));

BigInt.prototype.toJSON = function() { return this.toString() }; //fixgpt

resetDb();
initDb();
populateDb();

app.get('/', (req, res) => {
    res.send('Server attivo');
});

app.get('/keys', (req, res) => { 
    res.status(200).send(atob(process.env.VIDEO_KEY))
 })

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