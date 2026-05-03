# Proposta Progetto `NexuStream`

## Chi siamo?


- Davide Alaimo
- Claudio Luparello
- Christian Manto


## Cosa facciamo?


La nostra proposta è quella di realizzare un sito di streaming anime con un focus particolare sull'aspetto di discussione. Il nome del sito è ispirato proprio da questa filosofia: Nexus, un luogo centrale dove riunirsi.

Il sito è pensato per stimolare la discussione sugli episodi degli anime appena rilasciati: i commenti verranno aperti non appena l'episodio sarà disponibile per la visione, mentre dopo 2 settimane dall'uscita dell'episodio non sarà più possibile per gli utenti partecipare alla discussione. Questa scelta si adatta allo standard dell'industria che prevede solitamente il rilascio di episodi a cadenza settimanale fino al termine di una stagione. Inoltre è volta a permettere anche un'adeguata moderazione delle discussioni per il periodo in cui sono attive.

Nonostante ciò, prevediamo che una buona parte degli utenti potrebbe voler guardare le stagioni nella loro interezza al termine delle stesse. Per non precludere loro la possibilità di partecipare alla discussione, i commenti saranno riaperti al termine di una stagione, per un determinato periodo di tempo.

Il nostro obiettivo è quindi fare in modo di invogliare gli utenti a manifestare le proprie opinioni reali e "a caldo" su ciascuna serie, lasciando comunque una certa libertà sui tempi di visione.

Per casi particolari, si può prevedere in futuro il blocco o sblocco manuale delle discussioni da parte di utenti autorizzati.

Ogni episodio avrà una sezione commenti ad esso dedicata: i commenti supporteranno i timestamp del video, e **diversi** *stili* di **_formattazione_**. I commenti verranno gestiti come thread: sarà possibile quindi commentare l'episodio stesso o rispondere ad un commento particolare. L'intera thread farà sempre riferimento all'episodio.

Si prevede in futuro l'implementazione di una feature di traduzione automatica dei commenti, per esempio facendo uso delle tier gratis dell'API di Google Translate, per permettere una maggior interazione fra utenti di paesi diversi.


## Quali sono gli attori dell'applicazione?


| Attore | Ruolo |
|---|---|
| Utente | Crea e gestisce il proprio profilo.  registrazione e login. Una feature per il recupero password è prevista, utilizzando un API per le mail. Inoltre, l'utente visualizza contenuti streaming e le discussioni ad essi annesse: a queste ultime potrà partecipare nelle rispettive sezioni commenti. Oltre a ciò, è prevista una funzione di ricerca per trovare anime specifici in base al titolo o - possibilmente - tag, nonchè la possibilità di mettere like ai commenti e di inserire le serie nei propri preferiti, con appositi pulsanti. L'utente ha i privilegi più bassi di tutta l'applicazione. Si può prevedere eventualmente l'implementazione di diversi tier di utenti, e l'introduzione di abbonamenti che permettono l'accesso a diversi contenuti e funzionalità. |
| Moderatore | Gestisce l'interazione tra gli utenti, specificamente nelle sezioni commenti. Qualora un utente infranga i ToS della piattaforma, il Moderatore ha il diritto (e il dovere) di impedirgli di commentare, e di nascondere commenti offensivi. Qualora lasci un commento sotto qualche episodio, avrà un flair speciale accanto allo username. Può visualizzare tutti i commenti, compresi quelli nascosti, e sono previste funzionalità per facilitare l'operazione di moderazione, per esempio permettendogli di contrassegnare i commenti già approvati. Svolgerà le sue funzioni all'interno della sezione commenti stessa. |
| Gestore Catalogo | Il principale compito del Gestore Catalogo è mantenere aggiornato il catalogo delle serie - che sia aggiungendone di nuove o caricando episodi con qualità più alta o lingue diverse. Come il Moderatore, anche il Gestore Catalogo ha un flair speciale. Per svolgere le sue funzioni avrà accesso a schermate particolari, contenenti per esempio form per l'inserimento di nuovi contenuti. |
| Admin | L'admin si occupa di supervisionare Moderatori e Gestori Catalogo, che sono selezionati da lui personalmente. Può modificare lo status di ciascun utente a suo piacimento, avendo i privilegi più alti. Condivide le funzionalità di Moderatore e Gestore Catalogo. Inoltre, ha il flair più speciale di tutti. |
---


## Quali sono le relazioni tra i nostri attori?

Di seguito, un diagramma ER che mostra le relazioni basilari presenti nel sito, in concordanza con quanto descritto sopra:


![ERDiagram](ErDiagramma.png)

## Terms of Service
Di seguito, le regole del sito:
- Trattare gli altri utenti con rispetto. In altre parole, trattare il prossimo come si vorrebbe essere trattati.

- Qualunque tipo di spam sarà rimosso e, qualora un utente infranga questa regola più volte, sarà a rischio ban.

- Evitare di scrivere COMMENTI IN CAPS.

- Insulti contro lo staff del sito o altri utenti non saranno tollerati, e comporteranno azioni disciplinari.

- Usare un linguaggio consono, riducendo al minimo improperie e imprecazioni varie. Cercare di attenersi al topic attuale.
