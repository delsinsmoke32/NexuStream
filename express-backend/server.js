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
const genreRoute = require("./routes/genre");
const uploadRoute = require("./routes/upload");
const adminRoute = require("./routes/adminPage");
const cataloguerRoute = require("./routes/cataloguerPage");
const modRoute = require("./routes/modPage");
const showRoute = require("./routes/show");
const detectLanguage = require("./middleware/detectLanguage");
const resetDb = require('./db/db').resetDb;
const db = require("./db/db").db;
const initDb = require("./db/db").initDb;
const populateDb = require("./db/populateDb").populateDb
const propicRoute = require("./routes/propic")
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || "localhost"
const PORT = process.env.PORT || 3000;

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
                url: `http://${HOST}:${PORT}`,
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

// const corsOptions = {
//     origin: 'http://localhost:8100', // <-- Cambia 8100 con 4200 se usi Angular liscio!
//     credentials: true, //  IL PASS VIP CHE RISOLVE L'ERRORE
// };

const whitelist = ['http://localhost:8100', 'http://localhost:8101'];

const corsOptions = {
    origin: function (origin, callback) {
        // !origin permette il funzionamento di tool come Postman o curl
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Non consentito dalla politica CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);





app.use(cors(corsOptions));
app.use(express.json());
app.use(detectLanguage);
app.use('/api/login', loginRoute);
app.use('/api/register', registerRoute);
app.use('/api/users', userRoute);
app.use('/api/home', homeRoute);
app.use('/api/search', searchRoute);
app.use('/api/genres', genreRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/admin/users', adminRoute);
app.use('/api/cataloguer', cataloguerRoute);
app.use('/api/mod', modRoute);
app.use("/api/shows", showRoute);
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/propics', propicRoute);

BigInt.prototype.toJSON = function() { return this.toString() }; //fixgpt

resetDb();
initDb();
populateDb();

app.get('/', (req, res) => {
    res.send('Server attivo');
});

//LASCIARE SEMPRE PER ULTIMA, ALTRIMENTI OGNI RICHIESTA DIVENTA 404
app.use((req, res) => {
    res.status(404).json({message: 'Pagina non trovata.'});
})


app.listen(PORT, HOST, () => {
    console.log(`Server in ascolto su http://${HOST}:${PORT}`);
});