# NexuStream

Repository per il progetto di Programmazione Web/Mobile

## Guida:

### Frontend

Dentro `ionic-frontend`, per il serve:

```sh
ionic serve --configuration=lang --host=ip
```

dove `lang` è il linguaggio desiderato tra `it` ed `en` (se si esclude è `it`) e `ip` è l'indirizzo IP da usare per il server frontend (per testare su telefono sulla stessa rete WiFi, il valore default è `localhost`). La porta è `8100`.

Per la build (accessibile alla porta `8101`)

```sh
ionic build --watch
node frontend.cjs
```

Per build o serve, impostare in (necessario solo se si è modificata la configurazione dal backend):

```sh
src/environments/environment.ts # non usato al momento
src/environments/environment.development.ts # per ng serve
src/environments/environment.prod.ts # per ng build
```

l'`host` e `port` utilizzati dal backend, di default `localhost` e `3000`.

### Backend

Dentro `express-backend`:

```sh
npm run dev
```

Eventualmente modificare `.env` per impostare `HOST` e `PORT` del backend, di default `localhost` e `3000`. Se non si ha `.env`, creare e copiare i contenuti di `.env.example` al suo interno.

### REQUIREMENTS

Scaricare l'[ultima versione](https://www.gyan.dev/ffmpeg/builds/) di `ffmpeg` per il proprio sistema operativo e assicurarsi che sia aggiunta al path (deve funzionare il comando `ffmpeg` da terminale), necessario se si vogliono caricare video e tracce.

I node modules sono da installare rispettivamente nelle cartelle `express-backend` e `ionic-frontend`.

Nella directory root della repository si trova la cartella `test_files`, contente files utili al testing delle features.

### NOTE

Il database non è permanente e viene resettato ogni volta che si esegue il server, per cui utenti creati non verranno mantenuti così come eventuali contenuti caricati. I file statici rimarranno. Sconsigliato cancellare serie, stagioni ed episodi default poiché si perderebbero i file ma rimarrebbero nel database.

Per credenziali di utenti con vari privilegi, si può esaminare il file `db/populateDb.js`. Le credenziali dell'admin si trovano anche esse in quel file, ma per comodità sono:

```
mail: admin@stream.it
password: admin123
```
