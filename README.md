# ProgettoNS
---
## Sommario
 
1. [**Descrizione del Progetto**](#1-descrizione-del-progetto)
2. [**Tecnologie Utilizzate**](#2-tecnologie-utilizzate)
3. [**Setup del Progetto**](#3-setup-del-progetto)
4. [**Struttura del Progetto**](#4-struttura-del-progetto)
5. [**Descrizione dei Componenti**](#5-descrizione-dei-componenti)
    - `App.js`
    - `LoginScreen.js`
    - `RegisterScreen.js`
    - `Home.js`
    - `Broadcaster.js`
    - `Viewer.js`
    - `signaling.js`
    - `server/server.js`
    - `identityProvider/server.js`

6. [**Diagramma di flusso per l'accesso**](#6-diagramma-di-flusso-per-accesso)


---
 
## 1. Descrizione del Progetto
 
Il progetto è un'applicazione mobile che consente agli utenti, dopo essersi registrati ed autenticati, di trasmettere e visualizzare flussi video in tempo reale. La piattaforma permette a un utente di avviare una trasmissione video (il "broadcaster") e ad altri utenti di unirsi alla diretta come "viewer". La comunicazione tra i vari componenti dell'app viene gestita tramite WebRTC per il flusso multimediale e Socket.IO per il signaling tra i dispositivi. Il sistema di autenticazione è basato su token JWT.
 
---

## 2. Tecnologie Utilizzate
 
- **React Native**: Framework per la costruzione di applicazioni mobili per iOS e Android utilizzando JavaScript e React.
- **WebRTC**: Tecnologia che consente la comunicazione peer-to-peer (P2P) per lo streaming audio e video in tempo reale.
- **Socket.IO**: Libreria per la comunicazione in tempo reale tra client e server attraverso WebSockets, utilizzata per il signaling e la gestione degli eventi in tempo reale.
- **React Navigation**: Libreria per la gestione della navigazione tra le schermate dell'app.
- **React Native WebRTC**: Modulo per integrare WebRTC con React Native, permettendo la gestione dei flussi audio e video.
- **Mongodb**: Database document-oriented per la persistenza dei dati.
- **JWT (JSON Web Token)**: Sistema di autenticazione basato su token.
- **AsyncStorage**: Per la gestione dello stato locale e della persistenza del token di autenticazione.
- **bcryptjs**: Per la crittografia delle password.
- **Axios**: Libreria per effettuare richieste al backend.
 
---

## 3. Setup del Progetto
 
Dopo aver scaricato il progetto dal repository GitHub, è necessario seguire questi passaggi per configurare correttamente l'ambiente di sviluppo ed eseguire l'applicazione.
 
### 1. **Clonare il Repository**
 
Per prima cosa, assicurati di avere **Git** installato sul tuo sistema. Se non hai ancora clonato il progetto, esegui il comando seguente per ottenere una copia del repository:
 
```bash
git clone https://github.com/ClaudiaCastellano/ProgettoWebRTC.git
```
 
### 2. **Installare Node.js**
 
Il progetto richiede **Node.js** (versione 18 o superiore) per gestire le dipendenze. Puoi scaricare e installare Node.js dal [sito ufficiale](https://nodejs.org/).
 
Verifica di avere la versione corretta di Node.js eseguendo:
 
```bash
node -v
```
 
Assicurati che la versione sia almeno la 18.x.x, come specificato nel file `package.json` sotto `engines`.
 
### 3. **Installare le Dipendenze**
 
Accedi alla cartella del progetto e installa le dipendenze necessarie utilizzando **npm** o **yarn**.
 
Esegui il comando nella directory **client** del progetto:
 
```bash
cd client
npm install
```
 
Oppure se stai usando **yarn**:
 
```bash
yarn install
```
 
Questo comando installerà tutte le dipendenze elencate nel file `package.json`.
 
### 4. **Configurare il Progetto per Android e iOS**

Modifica l'indirizzo IP del server di segnalazione nel file `/client/pages/signaling.js`.
 
Per avviare l'applicazione su un dispositivo o emulatore Android o iOS, è necessario avere correttamente configurato il proprio ambiente di sviluppo. Ecco i passaggi:
 
#### a. **Android**
 
- Assicurati di avere **Android Studio** installato. Se non ce l'hai, puoi scaricarlo da [qui](https://developer.android.com/studio).
- Verifica di avere configurato correttamente le **variabili d'ambiente** per Android, inclusi `ANDROID_HOME` e il path verso gli SDK Android. Puoi seguire la [guida ufficiale di React Native per Android](https://reactnative.dev/docs/environment-setup) per configurare l'ambiente di sviluppo su Android.
 
#### b. **iOS (Solo per macOS)**
 
- Per sviluppare su **iOS**, hai bisogno di un **Mac** con **Xcode** installato. Puoi scaricare Xcode dal Mac App Store.
- Verifica che tu abbia Xcode correttamente configurato e che le versioni di **CocoaPods** siano aggiornate.
 
```bash
sudo gem install cocoapods
```
 
### 5. **Avviare il Server di Metro**
 
Il server di **Metro** è un server di bundling per React Native che gestisce il caricamento del codice JavaScript durante lo sviluppo. Avvia il server di Metro con il comando:
 
```bash
npx react-native start
```
 
Questo avvierà il bundler in modalità di sviluppo. Lascia aperto questo terminale, poiché dovrai mantenere il server in esecuzione.
 
### 6. **Eseguire l'App su Android o iOS**
 
#### a. **Android**
 
Se hai un dispositivo Android collegato o un emulatore in esecuzione, puoi eseguire l'app con il comando:
 
```bash
npx react-native run-android
```
 
Questo avvierà l'app sul dispositivo o sull'emulatore Android.
 
#### b. **iOS**
 
Se stai lavorando su macOS e hai Xcode configurato correttamente, puoi eseguire l'app su un dispositivo iOS o su un simulatore iOS con il comando:
 
```bash
npx react-native run-ios
```
 
Questo avvierà l'app sul simulatore iOS o sul dispositivo fisico (se configurato).

### 6. **Avviare i server**

#### a. signaling server

Per avviare il server di segnalazione spostati nella cartella `server` ed esegui il comando 
```bash
node server.js
```

Questo metterà il server di segnalazione in ascolto sul porto 3000.

#### b. identity provider

- Come prima cosa assicurati di avere **mongodb** istallato nel tuo sistema. Se non lo hai puoi scaricarlo [seguendo questa guida](https://www.mongodb.com/docs/manual/installation/).
- Dopo averlo istallato assicurati che sia in esecuzione.
- Nella cartella `identityProvider` crea un file `.env` e assegna alla variabile `DB_URI` l'indirizzo del database e alla variabile `SECRET_KEY` una stringa da usare come chiave per la generazione del token.
- A questo punto avvia il server identity provider spostantodi nella cartella `identityProvider` ed eseguendo il comando 
```bash
node server.js
```
Questo metterà il server di identity provider in ascolto sul porto 4000 e mostrerà il log "Connesso a MongoDB" se la connessione con il database è avvenuta correttamente.
 
## 4. Struttura del Progetto
 
La struttura principale del progetto include:
 
```
/ProgettoWebRTC
  /client
    /android
    /ios
    /pages
      Broadcaster.js
      Home.js
      Viewer.js
      styles.js
      signaling.js
      LoginScreen.js
      RegisterScreen.js  
    App.js
    package.json
  /server
    server.js
    package.json
  /identityProvider
    /models
        User.js
        ActiveTokens.js
    server.js
    package.json
```
 
- **App.js**: Definisce la navigazione dell'applicazione.
- **LoginScreen.js**: Schermata di login.
- **RegisterScreen.js**: Schermata di registrazione.
- **Home.js**: La schermata principale dove l'utente può scegliere di unirsi a una trasmissione o avviare una nuova diretta.
- **Broadcaster.js**: Schermata per l'utente che trasmette il video (broadcaster).
- **Viewer.js**: Schermata per l'utente che guarda la diretta.
- **signaling.js** Gestisce la comunicazione WebRTC tra client e server tramite WebSocket.
- **server/serves.js**: Server per lo scambio di informazioni di segnalazione.
- **identityPrvider/server.js**: Server per la gestione della autenticazione degli utenti
 
---

## 5. Descrizione dei Componenti
 
### `App.js`
 
- **Funzione**: Gestisce la navigazione tra le schermate dell'applicazione.
- **StackNavigator**: Imposta il flusso di navigazione, permettendo agli utenti di spostarsi tra la schermata Home, il Broadcaster e il Viewer.
- **Schermate**:
  - **Home**: Schermata per la home page che offre la possibilità di avviare o partecipare a una trasmissione.
  - **Broadcaster**: Schermata per la gestione del flusso video da parte di un broadcaster.
  - **Viewer**: Schermata per i viewer che guardano la diretta.
  - **Login**: Schermata per il login degli utenti.
  - **Register**: Schermata per la registrazione di un nuovo utente.
- **Funzione principale**:
  - `setupSocket()`: prova ad inizializzare la socket. Se la connessione va a buon fine significa che l'utente è autenticato e di conseguenza mostra direttamente la schermata Home. Se invece si verificano errori di connessione viene mostrata la schermata di login.

### `LoginScreen`
- **Funzione**: Schermata di login che permette agli utenti di autenticarsi inserendo email e password.
- **Stato**:
  - `email`: email fornita dall'utente.
  - `password`: password fornita dall'utente.
- **Funzione principale**:
  - `handleLogin()`: Gestisce il login inviando una richiesta all'identity provider e salvando il token ricevuto.

### `RegisterScreen`
- **Funzione**: Schermata di resgistrazione che consente agli utenti di creare un nuovo account.
- **Stato**:
  - `email`: email fornita del nuovo account.
  - `password`: password per il nuovo account.
  - `confirmPassword`: conferma della password per la corretta registrazione.
- **Funzione principale**:
  - `handleRegister()`: Gestisce la registrazione eseguendo un check sulle password e inviando una richiesta all'identity provider.

 
### `Home.js`
 
- **Funzione**: La schermata principale in cui l'utente autenticato può scegliere se unirsi a una diretta esistente, avviarne una nuova o effettuare il logout.
- **Stato**:
  - `streamId`: ID per l'identificazione delle dirette.
  - `availableStreams`: Elenco delle dirette disponibili a cui l'utente può unirsi.
  - `modalVisible`: Controlla la visibilità della finestra modale che mostra le dirette disponibili.
  - `showInput`: Determina se mostrare il campo di input per l'ID diretta.
  - `username`: Usato per visualizzare il corretto username dell'utente in seguito al login. 
- **Funzioni principali**:
  - `setupSocket()`: Inizializza la socket.
  - `fetchAvailableStreams()`: Richiede la lista delle dirette disponibili al server tramite Socket.IO.
  - `joinStream()`: Permette di unirsi alla diretta selezionata.
  - `startBroadcast()`: Avvia una nuova diretta se è stato fornito un `streamId`.
  - `handleLogout()`: Gestisce il logout eliminando i token e disconnettendo la socket.
 
### `Broadcaster.js`
 
- **Funzione**: Gestisce la trasmissione video dal broadcaster.
- **Stato**:
  - `stream`: Rappresenta lo stream video locale del broadcaster.
  - `error`: Gestisce eventuali errori che si verificano durante la trasmissione.
  - `userCount`: Numero di utenti connessi alla trasmissione.
  - `errorShown`: Consente di verificare se l'errore è stato già visualizzato.
  - `isFront`: Permette di gestire la fotocamera.
 
- **Funzioni principali**:
  - `getStream()`: Ottiene il flusso video e audio dal dispositivo dell'utente.
  - `startBroadcast()`: Inizializza la trasmissione e gestisce gli eventi trasmessi dal server di segnalazione.
  - `toggleCamera()`: Permette di cambiare tra la fotocamera frontale e quella posteriore.
 
### `Viewer.js`
 
- **Funzione**: Gestisce la visualizzazione di una diretta da parte dei viewer.
- **Stato**:
  - `remoteStreams`: Elenco dei flussi remoti ricevuti dal broadcaster.
  - `userCount`: Numero di utenti connessi alla diretta.
  - `error`: Gestisce gli errori durante la visualizzazione.
  - `errorShown`: Consente di verificare se l'errore è stato già visualizzato.
- **Funzioni principali**:
  - `startViewer()`: Si connette alla trasmissione, riceve i flussi dal broadcaster e gestisce gli eventi trasmessi dal server di segnalazione.
  - `ontrack`: Aggiunge il flusso remoto alla lista di `remoteStreams` quando il flusso viene ricevuto.

 ### `server/server.js`

- **Gestione delle dirette live**:

   - Mantiene un elenco di tutte le dirette attive (`liveStreams`), associando un ID di diretta a un oggetto che contiene l'ID del broadcaster e gli ID dei viewer connessi.

   - Gestisce l'avvio e la fine delle dirette, assicurandosi che solo un broadcaster possa avviare una diretta e che i viewer possano connettersi a una diretta esistente.
 
- **Middleware per verificare le connessioni WebSocket**:

   - Quando un utente prova a connettersi, il server verifica il token inviando una richiesta all'identity provider.

   - Se il token è valido accetta la connessione e consente all'utente l'accesso alle funzionalità dell'applicazione; se invece il token non è valido rifiuta la connessione e invia un errore. 

- **Funzioni principali del server**:

   - **Avvio di una diretta (`start-broadcast`)**: Il broadcaster invia un evento con l'ID della diretta. Il server come prima cosa verifica se il token è ancora valido. In caso affermativo, se la diretta non esiste, il server crea una nuova sessione di streaming e aggiunge il broadcaster.

   - **Partecipazione di un viewer (`join-broadcast`)**: I viewer inviano l'ID della diretta a cui vogliono unirsi. Il server come prima cosa verifica se il token è ancora valido. In caso affermativo, se la diretta esiste, vengono aggiunti alla sessione e viene notificato a tutti gli utenti connessi il numero aggiornato di partecipanti.

   - **Invio di segnali**: Quando il broadcaster o un viewer invia segnali (per esempio, offerte/risposte SDP oppure candidati ICE), il server inoltra questi segnali ai destinatari (broadcaster o viewer).

   - **Disconnessione di un utente (`disconnect`)**: Quando un utente si disconnette, il server gestisce la sua uscita dalla diretta, rimuovendolo dalla lista dei partecipanti e notificando gli altri utenti.

   - **Uscita volontaria da una diretta (`leave-broadcast`)**: Gli utenti (sia broadcaster che viewer) possono lasciare volontariamente una diretta. In questo caso, il server aggiorna la lista dei partecipanti e invia le notifiche appropriate.
 
- **Gestione degli eventi Socket.IO**:

   - **`get-streams`**: Restituisce la lista delle dirette attive quando richiesto da un client.

   - **`start-broadcast`**: Permette a un broadcaster di avviare una nuova diretta.

   - **`join-broadcast`**: Permette a un viewer di unirsi a una diretta.

   - **`signal`**: Inoltra segnali tra broadcaster e viewer per stabilire una connessione peer-to-peer.

   - **`disconnect`**: Gestisce la disconnessione degli utenti e la loro uscita dalle dirette.

   - **`leave-broadcast`**: Permette a un utente di uscire manualmente da una diretta.
 
- **Gestione delle notifiche**:

   - **`user-count`**: Notifica a tutti i partecipanti il numero aggiornato di utenti connessi a una diretta.

   - **`viewer-disconnect`**: Notifica a tutti i partecipanti quando un viewer si disconnette.

   - **`broadcast-ended`**: Notifica a tutti i viewer quando una diretta è terminata dal broadcaster.
 
### `identityProvider/server.js`
 
 - **Funzioni principali del server identity provider**:
   
   - **Registrazione utente (`POST /register`)**: Registra un nuovo utente nel database con una password crittografata.
   - **Login utente (`POST /login`)**: Verifica le credenziali dell'utente e restituisce un token JWT. Blocca per 15 minuti l'account di un utente che inserisce una passowrd errata per tre volte consecutive. 
   - **Logout utente (`POST /logout`)**: Revoca il token di autenticazione attuale dell'utente.
   - **Accesso protetto (`POST /protected`)**: Endpoint che richiede un token JWD valido in modo da autorizzare l'accesso al sistema.

 - **Middleware di autenticazione (`authenticate`)**: Verifica se il token JWT è valido e attivo prima di consentire l'accesso all'endpoint protetto.

 ---

## 6. Diagramma di flusso per accesso
 
 
![diagrammaFlusso](images/diagrammaFlusso.png)

Il client, all'avvio dell'app, recupera il token dall'AsyncStorage e lo invia nella richiesta di connessione verso il server di segnalazione. 

Il server di segnalazione, prima di accettare la connessione contatta l'identity provider per sapere se il token che ha ricevuto è valido e attivo. 

L'identity provider controlla se il token è attivo interrogato il database in cui conserva informazioni sui token attivi. In caso affermativo ne controlla la validità decodificandolo con il secret. 

Se il token è valido e attivo, il server accetta la connessione, l'utente è autenticato e può accedere alla schermata Home.

Se il token non è presente nell'AsyncStorage oppure è presente ma non è valido e/o attivo, il server rifiuta la connessione e all'utente viene chiesto di eseguire nuovamente il login e viene dunque indirizzato alla schermata LoginScreen.
