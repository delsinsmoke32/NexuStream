const express = require('express');
const path = require('path');
const app = express();

// Carica i file statici compilati da Angular
app.use('/it', express.static(path.join(__dirname, 'www/it')));
app.use('/en', express.static(path.join(__dirname, 'www/en')));

// Gestione del Deep Linking (Risolve il problema dei 404 come /en/login)
app.get("/:lang/*splat", (req, res) => {
  const lang = req.params.lang;
  res.sendFile(path.join(__dirname, `www/${lang}/index.html`));
});

// Reindirizzamento automatico iniziale

app.get("/*splat", (req, res) => {
  res.redirect('/it');
});

app.get("", (req, res) => {
  res.redirect('/it');
});

const PORT = 8101;
app.listen(PORT, () => console.log(`Frontend in esecuzione sulla porta ${PORT}`));