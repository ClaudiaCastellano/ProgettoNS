const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const axios = require('axios');

const privateKey = fs.readFileSync("../certificati/192.168.1.90-key.pem", "utf8");
const certificate = fs.readFileSync("../certificati/192.168.1.90.pem", "utf8");
const credentials = { key: privateKey, cert: certificate };

const app = express();
const server = https.createServer(credentials, app);
const io = new Server(server, { cors: { origin: "*" } });


const liveStreams = {}; // Memorizza gli ID delle dirette e i relativi utenti

//Middleware per verificare il token
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token; // Estrai il token dall’handshake
  if (!token) {
      return next(new Error("Token mancante"));
  }
  try {
      // Verifica il token chiamando l'endpoint del server IDP
      const response = await axios.get("https://192.168.1.90:4000/protected", {
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
  if (stream.broadcaster === socket.id) {
    // Termina la diretta
    stream.viewers.forEach((viewerId) => {
      io.to(viewerId).emit("broadcast-ended");
    });
    delete liveStreams[streamId];
    console.log(`Diretta terminata: ${streamId}`);
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

// Gestione degli eventi WebSocket
io.on("connection", (socket) => {
  console.log("Utente connesso:", socket.id, "Username:", socket.user);
  socket.emit("username", socket.user);

  // Invia la lista delle dirette attive
  socket.on("get-streams", () => {
    socket.emit("available-streams", Object.keys(liveStreams));
  });

  // Avvio di una diretta
  socket.on("start-broadcast", (streamId) => {
    if (liveStreams[streamId]) {
      socket.emit("error-broadcaster", "Diretta già esistente");
      return;
    }
    liveStreams[streamId] = { broadcaster: socket.id, viewers: [] };
    socket.join(streamId);
    console.log(`Diretta "${streamId}" avviata da ${socket.user}`);
  });

  //  Unirsi a una diretta
  socket.on("join-broadcast", (streamId) => {
    const stream = liveStreams[streamId];
    if (!stream) {
      socket.emit("error-viewer", "Diretta non trovata");
      return;
    }
    stream.viewers.push(socket.id);
    socket.join(streamId);
    io.to(streamId).emit("user-count", stream.viewers.length + 1);
    socket.to(streamId).emit("join-viewer", socket.id);
    console.log(`Utente ${socket.user} si è unito alla diretta "${streamId}"`);
  });

  // Scambio di segnali WebRTC
  socket.on("signal", ({ streamId, to, signal }) => {
    const stream = liveStreams[streamId];
    if (!stream) return;

    if (socket.id === stream.broadcaster) {
      console.log(`Segnale inviato dal broadcaster ${socket.user} al viewer`);
      io.to(to).emit("signal", { from: socket.id, signal });
    } else {
      console.log(`Segnale inviato dal viewer ${socket.user} al broadcaster`);
      io.to(stream.broadcaster).emit("signal", { from: socket.id, signal });
    }
  });

  // Gestione disconnessione
  socket.on("disconnect", () => {
    console.log(`Utente ${socket.user} disconnesso`);

    Object.keys(liveStreams).forEach((streamId) => {
      const stream = liveStreams[streamId];
      if (stream.broadcaster === socket.id || stream.viewers.includes(socket.id)) {
        handlerLeaveBroadcast(socket, streamId);
      }
    });
  });

  // Uscire manualmente da una diretta
  socket.on("leave-broadcast", (streamId) => {
    handlerLeaveBroadcast(socket, streamId);
  });
});

// Avvio del server
server.listen(3000, "0.0.0.0", () => {
  console.log("Signaling server in ascolto su porta 3000");
});
