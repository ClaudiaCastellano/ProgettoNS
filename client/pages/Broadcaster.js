import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from "react";
import {View, Text, Alert, TouchableOpacity} from "react-native";
import { RTCView, mediaDevices, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { getSocket } from "./signaling";
import {broadcasterStyle} from "./styles";

// Creazione del functional component BroadcasterPage
const BroadcasterPage = ({ route, navigation }) => {
    const { streamId, username } = route.params; // Ottiene lo streamId e il nome utente passati come parametri
    const [stream, setStream] = useState(null); // Stato per il flusso video
    const peerConnections = useRef({});  // Registro delle connessioni peer
    const [error, setError] = useState(null); // Stato per l'errore
    const [errorShown, setErrorShown] = useState(false);  // Stato per mostrare l'errore
    const [isFront, setIsFront] = useState(true); // Stato per la fotocamera
    const localStream = useRef(null); // Flusso locale del broadcaster
    const [userCount, setUserCount] = useState(0); // Stato per il conteggio degli utenti

    // Ottiene l'istanza della socket
    const socket = getSocket();

    useEffect(() => {
        if (error && !errorShown) {
            // Mostra l'alert solo se l'errore non è stato ancora mostrato
            Alert.alert("Errore", error, [{ text: "OK", onPress: () => {
                setError(null);
                setErrorShown(true);  // Imposta flag a true dopo aver mostrato l'alert
                if(error === "Token non valido" || error === "Token mancante"){
                    navigation.navigate("Login"); // Naviga alla schermata di login in caso di errore di token
                }else{
                    navigation.navigate("Home", { username });
                }
               
            }}]);
        }
    }, [error, errorShown]);

    // Funzione per ottenere il flusso video
    const getStream = async (facing) => {
        try {
            const localStream = await mediaDevices.getUserMedia({
                video: { facingMode: facing ? "user" : "environment" }, // Imposta la fotocamera frontale o posteriore
                audio: true // Abilita l'audio
            });

            return localStream;
        } catch (error) {
            // In caso di errore, mostra l'errore
            setError("Autorizzazione necessaria. Per continuare consenti l'accesso alla fotocamera e al microfono dalle impostazioni del dispositivo.");
        }
    };

    useEffect(() => {
        
        // Funzione per avviare la trasmissione
        const startBroadcast = async () => {
            console.log("Sono il broadcaster dello stream:", streamId);

            // Ottiene il flusso video locale
            localStream.current = await getStream(isFront);
            setStream(localStream.current); // Imposta il flusso video locale
            if (!localStream.current) return; // Se non c'è flusso, esce dalla funzione

            // Invia il segnale di inizio trasmissione
            socket.emit("start-broadcast", streamId);

            // Listener per ricevere i segnali dai viewer
            socket.on("signal", async ({ from, signal }) => {
                console.log("Ricevuto segnale:", signal);
                // Ottiene la connessione peer dal registro
                const pc = peerConnections.current[from];
                // Se la connessione peer non è trovata, mostra un messaggio di avviso
                if (!pc) {
                    console.warn(`Connessione peer non trovata per viewer ${from}`);
                    return;
                }
                
                //Se il segnale contiene un candidato ICE, lo aggiunge alla connessione
                if (signal.candidate) {
                    console.log(`Aggiungo ICE Candidate dal viewer ${from}`);
                    await pc.addIceCandidate(signal);
                // Se il segnale contiene una risposta SDP, la imposta come remota
                } else if (signal.type === "answer") {
                    console.log(`Ricevuta risposta SDP dal viewer ${from}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                }
                    
            });
            
            // Listener per ricevere i viewer che si uniscono alla diretta
            socket.on("join-viewer", async (viewerId) => {

                // Crea una nuova connessione peer
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });
        
                // Flusso del broadcaster aggiunto al peer connection
                localStream.current.getTracks().forEach((track) => pc.addTrack(track, localStream.current));
    
                // Invia i candidati ICE al viewer
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log(`Invio ICE Candidate al viewer ${viewerId}`);
                        socket.emit("signal", { streamId, to: viewerId, signal: event.candidate });
                    }
                };
        
                // Crea un'offerta SDP per il viewer
                const offer = await pc.createOffer();
                // Imposta l'offerta come descrizione locale
                await pc.setLocalDescription(offer);
                console.log(`Invio offerta SDP al viewer ${viewerId}`);
                socket.emit("signal", { streamId, to: viewerId, signal: offer });
    
                // Aggiunge la connessione al registro
                peerConnections.current[viewerId] = pc;
                        
            });
            
            // Listener per ricevere il conteggio degli utenti
            socket.on("user-count", (count) => {
                console.log("Utenti connessi:", count);
                setUserCount(count-1);
            });

            // Listener per ricevere la disconnessione del viewer
            socket.on("viewer-disconnect", (viewerId) => {
                console.log(`Viewer disconnesso: ${viewerId}`);
                const pc = peerConnections.current[viewerId];
                if (pc) {
                    pc.close(); // Chiude la connessione peer
                    delete peerConnections.current[viewerId]; // Elimina la connessione dal registro
                }
            });

            // Listener per ricevere l'errore di diretta già esistente
            socket.on("error-broadcaster", (err) => {
                setError(err);
            });
        
        };

        // Avvia la trasmissione
        startBroadcast();

        return () => {
            socket.emit("leave-broadcast", streamId); 
            console.log("ho invocato leave broadcast");
            Object.values(peerConnections.current).forEach((pc) => pc.close());
        };
    }, [streamId, navigation]);

    // Funzione per cambiare la fotocamera
    const toggleCamera = async () => {
        if (!stream) return;

        const newIsFront = !isFront;
        setIsFront(newIsFront);

        // Ottiene il nuovo flusso video con la fotocamera selezionata
        const newStream = await getStream(newIsFront);
        if (!newStream) return; // Se non c'è flusso, esce dalla funzione

        // Sostituzione dei nuovi track nella connessione peer
        Object.values(peerConnections.current).forEach((pc) => {
            pc.getSenders().forEach((sender) => {
                if (sender.track.kind === "video") {
                    sender.replaceTrack(newStream.getVideoTracks()[0]);
                }
            });
        });

        // Sostituzione del flusso locale con il nuovo flusso
        localStream.current = newStream;
        setStream(newStream);
    };

    return (
        <View style={broadcasterStyle.container}>
            <Text style={broadcasterStyle.title}> Diretta "{streamId}" avviata</Text>
            <Text style={broadcasterStyle.title}>Utenti connessi: {userCount}</Text>
        
            {/* Mostra il tuo flusso locale del broadcaster */}
            {stream && (
                <RTCView streamURL={stream.toURL()} style={broadcasterStyle.video} />
            )}
            {!stream && (
                <Text>Sto cercando di acquisire il flusso video...</Text>
            )}
        
            {/* Pulsante per girare la fotocamera */}
            <TouchableOpacity style={broadcasterStyle.switchButton} onPress={toggleCamera}>
                <Text style={broadcasterStyle.buttonText}>🔄 Cambia fotocamera</Text>
            </TouchableOpacity>
        </View>
    );
};


export default BroadcasterPage;
