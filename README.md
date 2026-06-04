# NexuStream

Repository per il progetto di Programmazione Web/Mobile

## Guida:

### Frontend

Dentro `ionic-frontend`, per il serve:

```sh
ionic serve --configuration=lang --host=ip
```

dove `lang` è il linguaggio desiderato tra `it` ed `en` (se si esclude è `it`) e `ip` è l'indirizzo IP da usare per il server frontend (per testare su telefono sulla stessa rete WiFi).

Per la build:

```sh
ionic build
node frontend.cjs
```

Per build o serve, impostare in:

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

Eventualmente modificare `.env` per impostare `HOST` e `PORT` del backend, di default `localhost` e `3000`.

`! Momentaneamente`

Scaricare l'ultima versione di `ffmpeg` per il proprio sistema operativo e spostare i contenuti della cartella principale dentro `ffmpeg_installation`.
