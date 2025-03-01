const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const axios = require('axios');
const config = require('./config.js');

const privateKey = fs.readFileSync("../certificati/172.20.10.2-key.pem", "utf8");
const certificate = fs.readFileSync("../certificati/172.20.10.2.pem", "utf8");
const credentials = { key: privateKey, cert: certificate };

const app = express();
const server = https.createServer(credentials, app);
const io = new Server(server, { cors: { origin: "*" } });

const protectedUrl = `${config.IdP}/protected`;

const liveStreams = {}; // Memorizza gli ID delle dirette e i relativi utenti

//Middleware per verificare il token
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token; // Estrae il token dall’handshake
  // Se il token non è presente, interrompe la connessione
  if (!token) {
      return next(new Error("Token mancante"));
  }
  try {
      // Verifica il token chiamando l'endpoint del server IDP
      const response = await axios.get(protectedUrl, {
          headers: { Authorization: `Bearer ${token}` }
      });
      socket.user = response.data.user.email.split('@')[0]; // Salva i dati utente verificati
      next();
  } catch (error) {
      next(new Error("Token non valido"));
  }
});

//Funzione per gestire l'uscita di un utente da una diretta
function handlerLeaveBroadcast(socket, streamId) {
  const stream = liveStreams[streamId];
  if (!stream) return;

  console.log(`Utente ${socket.user} ha lasciato la diretta: ${streamId}`);
  // Se l'utente è il broadcaster, termina la diretta
  if (stream.broadcaster === socket.id) {
    // Termina la diretta
    stream.viewers.forEach((viewerId) => {
      io.to(viewerId).emit("broadcast-ended"); // Invia il segnale di fine diretta ai viewer
    });
    // Elimina la diretta dalla lista
    delete liveStreams[streamId];
    console.log(`Diretta terminata: ${streamId}`);
    // Se l'utente è un viewer, lo rimuove dalla lista dei viewer
  } else {
    socket.broadcast.emit("viewer-disconnect", socket.id);
    const index = stream.viewers.indexOf(socket.id);
    if (index !== -1) {
      stream.viewers.splice(index, 1);
      socket.leave(streamId);
      io.to(streamId).emit("user-count", stream.viewers.length + 1);
    }
  }
}

// Gestione della connessione
io.on("connection", (socket) => {
  console.log("Utente connesso:", socket.id, "Username:", socket.user);
  socket.emit("username", socket.user); // Invia il nome utente all'utente connesso

  // Invia la lista delle dirette attive
  socket.on("get-streams", () => {
    socket.emit("available-streams", Object.keys(liveStreams));
  });

  // Gestione avvio di una diretta
  socket.on("start-broadcast", (streamId) => {
    // Se l'ID diretta è già in uso, invia un errore
    if (liveStreams[streamId]) {
      socket.emit("error-broadcaster", "Diretta già esistente");
      return;
    }
    // Aggiunge la diretta alla lista delle dirette attive
    liveStreams[streamId] = { broadcaster: socket.id, viewers: [] };
    socket.join(streamId); 
    console.log(`Diretta "${streamId}" avviata da ${socket.user}`);
  });

  //  Gestione unione a una diretta
  socket.on("join-broadcast", (streamId) => {
    // Se l'ID diretta non esiste, invia un errore
    const stream = liveStreams[streamId];
    if (!stream) {
      socket.emit("error-viewer", "Diretta non trovata");
      return;
    }
    // Aggiunge l'utente alla lista dei viewer
    stream.viewers.push(socket.id);
    socket.join(streamId);
    io.to(streamId).emit("user-count", stream.viewers.length + 1); // Invia il conteggio degli utenti
    socket.to(streamId).emit("join-viewer", socket.id); // Invia il segnale di unione al broadcaster
    console.log(`Utente ${socket.user} si è unito alla diretta "${streamId}"`);
  });

  // Gestion segnali
  socket.on("signal", ({ streamId, to, signal }) => {
    // Se l'ID diretta non esiste, interrompe l'operazione
    const stream = liveStreams[streamId];
    if (!stream) return;

    // Se il segnale è inviato dal broadcaster, lo invia ai viewer
    if (socket.id === stream.broadcaster) {
      console.log(`Segnale inviato dal broadcaster ${socket.user} al viewer`);
      io.to(to).emit("signal", { from: socket.id, signal });
    } else {
      // Se il segnale è inviato da un viewer, lo invia al broadcaster
      console.log(`Segnale inviato dal viewer ${socket.user} al broadcaster`);
      io.to(stream.broadcaster).emit("signal", { from: socket.id, signal });
    }
  });

  // Gestione disconnessione
  socket.on("disconnect", () => {
    console.log(`Utente ${socket.user} disconnesso`);

    // Se l'utente è il broadcaster o un viewer, esegue la funzione di uscita
    Object.keys(liveStreams).forEach((streamId) => {
      const stream = liveStreams[streamId];
      if (stream.broadcaster === socket.id || stream.viewers.includes(socket.id)) {
        handlerLeaveBroadcast(socket, streamId);
      }
    });
  });

  // Gestione uscita da una diretta
  socket.on("leave-broadcast", (streamId) => {
    handlerLeaveBroadcast(socket, streamId);
  });
});

// Avvio del server
server.listen(3000, "0.0.0.0", () => {
  console.log("Signaling server in ascolto su porta 3000");
});
