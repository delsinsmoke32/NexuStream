# Proposta Progetto `NexuStream`

## Chi siamo?


- Davide Alaimo
- Claudio Luparello
- Christian Manto


## Cosa facciamo?


La nostra proposta è quella di realizzare un sito di streaming anime con un focus particolare sull'aspetto di discussione. Il nome del sito è ispirato proprio da questa filosofia: Nexus, un luogo centrale dove riunirsi.

Il sito è pensato per stimolare la discussione sugli anime appena rilasciati: infatti, dopo 2 settimane dall'uscita di un episodio di una serie, verrà posto un lock sui commenti, che verrà tolto solo alla fine della stagione stessa. Questo per fare in modo di invogliare gli utenti a manifestare le proprie opinioni reali e "a caldo" su ciascuna serie.

Ogni episodio avrà una sezione commenti ad esso dedicata: i commenti supporteranno i timestamp del video. Nel backend, verranno gestiti come thread: ogni commento avrà un genitore, tranne quelli "root" (che potrebbero avere un genitore invisibile di default). Inoltre, in futuro l'implementazione di una feature di traduzione automatica dei commenti, con le tier gratis dell'API di Google Translate, permetterebbe una maggior interazione fra utenti di paesi diversi.




## Quali sono gli attori dell'applicazione?


| Attore | Ruolo |
|---|---|
| Utente | Crea e gestisce il proprio profilo, tramite registrazione e login. Una feature per il recupero password è prevista, utilizzando un API per le mail. Inoltre, l'utente visualizza contenuti streaming e le discussioni ad essi annesse: a queste ultime potrà partecipare nelle rispettive sezioni commenti. Oltre a ciò, è prevista una funzione di ricerca per trovare anime specifici in base al titolo o - possibilmente - tag. L'utente ha i privilegi più bassi di tutta l'applicazione. Un utente guest, ossia un utente che non ha fatto il login o non si è registrato, non può commentare.|
| Moderatore | Gestisce l'interazione tra gli utenti, specificamente nelle sezioni commenti. Qualora un utente infranga i ToS della piattaforma, il Moderatore ha il diritto (e il dovere) di impedirgli di commentare. Qualora lasci un commento sotto qualche episodio, avrà un flair speciale accanto allo username.|
| Gestore Catalogo | Il principale compito del Gestore Catalogo è mantenere aggiornato il catalogo delle serie - che sia aggiungendone di nuove o caricando episodi con qualità più alta o lingue diverse. Come il Moderatore, anche il Gestore Catalogo ha un flair speciale.|
| Admin | L'admin si occupa di supervisionare Moderatori e Gestori Catalogo, che sono selezionati da lui personalmente. Può visualizzare la lista completa degli utenti del sito e modificare lo status di ciascuno di loro a suo piacimento, avendo i privilegi più alti. Inoltre, ha il flair più speciale di tutti.|
---


## Quali sono le relazioni tra i nostri attori?

Di seguito, un diagramma ER che mostra le relazioni basilari presenti nel sito, in concordanza con quanto descritto sopra:


![ERDiagram](ErDiagramma.png)

## Terms of Service
Di seguito, le regole del sito:
- Trattare gli altri utenti con rispetto. In altre parole, trattare il prossimo come si vorrebbe essere trattati.

- Qualunque tipo di spam sarà rimosso e, qualora un utente infranga questa regola più volte, sarà a rischio ban.

- Evitare di scrivere COMMENTI IN CAPS.

- Insulti e flame contro lo staff del sito o altri utenti non saranno tollerati, e comporteranno azioni disciplinari.

- Usare un linguaggio consono, riducendo al minimo improperie e imprecazioni varie. Cercare di attenersi al topic attuale.

- Qualunque tipo di hacking non sarà tollerato. Se volete qualche sfida, olicyber è la fuori.
