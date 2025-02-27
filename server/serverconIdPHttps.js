const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

const privateKey = fs.readFileSync("../certificati/192.168.1.90-key.pem", "utf8");
const certificate = fs.readFileSync("../certificati/192.168.1.90.pem", "utf8");
const credentials = { key: privateKey, cert: certificate};


const app = express();
const server = https.createServer(credentials, app);
const io = new Server(server);

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        reject('Token non valido');
      } else {
        resolve(decoded);
      }
    });
  });
};

const liveStreams = {}; // Memorizza gli ID delle dirette e i relativi utenti

function handlerLeaveBroadcast(socket, streamId) {
  const stream = liveStreams[streamId];
  if (!stream) return;

  console.log(`Utente ${socket.id} ha lasciato la diretta: ${streamId}`);
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
      console.log("stream dopo la disconnessione:", stream);
    }
  }
}

io.on("connection", (socket) => {
  console.log("Utente connesso:", socket.id);

  const token = socket.handshake.auth.token;  // Estrarre il token dalla query
  console.log("Token:", token);

  // Verifica del token
  verifyToken(token)
    .then((decoded) => {
      console.log('Autenticato con successo:', decoded);

      // A questo punto l'utente è autenticato e puoi permettergli di interagire con il server
      
      // Invia la lista delle dirette attive quando richiesto
        socket.on("get-streams", () => {
            const streamIds = Object.keys(liveStreams); // Ottiene tutti gli ID delle dirette attive
            socket.emit("available-streams", streamIds); // Invia la lista al client che ha fatto la richiesta
        });


        // Gestione dell'avvio di una diretta
        socket.on("start-broadcast", (streamId) => {
            if (liveStreams[streamId]) {
                socket.emit("error-broadcaster", "Diretta già esistente");
                return;
            }

            liveStreams[streamId] = { broadcaster: socket.id, viewers: [] };
            socket.join(streamId);
            console.log(`Diretta avviata: ${streamId}`);
        });

        // Gestione dell'ingresso di un viewer
        socket.on("join-broadcast", (streamId) => {
            const stream = liveStreams[streamId];
            if (!stream) {
                socket.emit("error-viewer", "Diretta non trovata");
                return;
            }

            // Aggiungi il viewer
            stream.viewers.push(socket.id);
            socket.join(streamId);

            // Comunica il numero di utenti connessi
            io.to(streamId).emit("user-count", stream.viewers.length + 1); // broadcaster + viewers
            socket.to(streamId).emit("join-viewer", socket.id);
            console.log("Ho inviato il numero di viewer");

            console.log(`Utente ${socket.id} si è unito alla diretta: ${streamId}`);
            console.log("Numero di viewer connessi:", stream.viewers.length)

        });

        // Gestione dei segnali (offerte, risposte, candidati ICE)
        socket.on("signal", ({ streamId, to, signal }) => {
            const stream = liveStreams[streamId];
            if (!stream) return;

            if (socket.id === stream.broadcaster) {
                // Il viewer a cui inviare il segnale è specificato in 'to'
                const targetViewerId = to; 
    
                if (targetViewerId) {
                    console.log(`Inoltro il segnale del broadcaster: ${stream.broadcaster} al viewer: ${targetViewerId}`);
                    console.log("Segnale:", signal);
                    io.to(targetViewerId).emit("signal", { from: socket.id, signal });
                } else {
                    console.log("Nessun viewer specificato per invio del segnale");
                }
            }else {
                // Se il segnale arriva da un viewer, viene inoltrato al broadcaster
                console.log(`Inoltro segnale del viewer ${socket.id} al broadcaster:`, stream.broadcaster);
                console.log("Segnale:", signal);
                io.to(stream.broadcaster).emit("signal", { from: socket.id, signal });
            }
        });

        socket.on("disconnect", () => {
            console.log("Utente disconnesso:", socket.id);

            // Troviamo in quali dirette il socket era coinvolto (come broadcaster o viewer)
            const streamIds = Object.keys(liveStreams);

            streamIds.forEach((streamId) => {
            const stream = liveStreams[streamId];

            if (stream.broadcaster === socket.id || stream.viewers.includes(socket.id)) {
                handlerLeaveBroadcast(socket, streamId);
            }
            });
        });
  

        socket.on("leave-broadcast", (streamId) => {
            handlerLeaveBroadcast(socket, streamId);
        });
    })
    .catch((err) => {
    console.error('Autenticazione fallita:', err);
    socket.disconnect();  // Rifiuta la connessione se il token non è valido
    });
});


server.listen(3000, "0.0.0.0", () => {
  console.log("Signaling server in ascolto su porta 3000");
});
