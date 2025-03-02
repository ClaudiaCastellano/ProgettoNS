import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert,} from "react-native";
import { RTCView, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { getSocket } from "./signaling";
import {styles} from "./styles";

// Creazione del functional component ViewerPage
const ViewerPage = ({ route, navigation }) => {
    const { streamId, username } = route.params; // Ottiene lo streamId e il nome utente passati come parametri
    const [remoteStreams, setRemoteStreams] = useState([]); // Stato per i flussi remoti
    const pc = useRef(null); // Connessione peer
    const [userCount, setUserCount] = useState(0); // Stato per il conteggio degli utenti
    const [error, setError] = useState(null); // Stato per l'errore
    const [errorShown, setErrorShown] = useState(false); // Stato per mostrare l'errore

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

    useEffect(() => {
        
        const startViewer = async () => {

            console.log("Sono un viewer dello stream:", streamId);
            try {
                // Inizializza la connessione peer
                pc.current = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });

                // Invia il segnale di join
                socket.emit("join-broadcast", streamId);

                
                pc.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("Invio ICE Candidate:", event.candidate);
                        socket.emit("signal", { streamId, signal: event.candidate }); // Invia l'ICE Candidate
                    }
                };
        
                // Listener per ricevere i segnali
                socket.on("signal", async ({ from, signal }) => {
                    console.log("Ricevuto segnale:", signal);
                    console.log("pc.current", pc.current);

                    // Se il segnale è un'offerta e la descrizione remota non è impostata
                    if (signal.type === "offer" && !pc.current.remoteDescription) {
                        console.log("Ricevuta offerta SDP dal broadcaster, preparo risposta...");
                        try {
                            // Imposta la descrizione remota
                            await pc.current.setRemoteDescription(new RTCSessionDescription(signal));
                            console.log("Impostata descrizione remota");
                            // Crea una risposta
                            const answer = await pc.current.createAnswer();
                            // Imposta la descrizione locale
                            await pc.current.setLocalDescription(answer);
                            // Invia la risposta al signaling server
                            socket.emit("signal", { streamId, signal: answer }); 
                            console.log("Invio risposta SDP al signaling server", answer);
                        } catch (error) {
                            console.log("Errore durante la ricezione dell'offerta:", error);
                        }
                        // Se il segnale è un candidato ICE
                    } else if (signal.candidate !== undefined) {
                        // Aggiunge l'ICE Candidate alla connessione
                        pc.current.addIceCandidate(signal);
                        console.log("Aggiunto ICE Candidate:", signal);
                    }
                   
                });
                
                // Listener per ricevere il segnale di fine diretta
                socket.on("broadcast-ended", () => {
                    setError("La diretta è stata interrotta");
                });

                // Listener per ricevere il conteggio degli utenti
                socket.on("user-count", (count) => {
                    console.log("Utenti connessi:", count);
                    setUserCount(count-1);
                });

               
                socket.on("error-viewer", (err) => {
                    setError(err);
                });

                // Listener per ricevere il flusso remoto
                pc.current.ontrack = (event) => {
                    console.log("Nuovo flusso ricevuto:", event.streams[0]);
                    setRemoteStreams((prev) => {
                        // Verifica se il flusso è già presente
                        const alreadyExists = prev.some((stream) => stream.id === event.streams[0].id);
                        // Se non esiste, lo aggiunge alla lista
                        if (!alreadyExists) {
                            return [...prev, event.streams[0]];
                        }
                        return prev;
                    });
            
                };
                
            } catch (error) {
                console.error("Errore durante l'inizializzazione della diretta:", error);
                Alert.alert("Errore", "Assicurati di aver dato i permessi necessari.");
            }
        
        };

        // Avvia la funzione startViewer
        startViewer();

        return () => {
            socket.emit("leave-broadcast", streamId);
            if (pc.current) {
                pc.current.close();
                pc.current = null;
                console.log("Connessione chiusa");
            }
        };
    }, [streamId, navigation]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}> Visualizzando diretta "{streamId}" </Text>
            <Text style={styles.title}>Utenti connessi: {userCount}</Text>
        
            {remoteStreams.length === 0 && (
            <Text>In attesa di flussi remoti...</Text>
            )}
        
            {remoteStreams.map((remoteStream, index) => {
                return (
                    <RTCView key={index} streamURL={remoteStream.toURL()} style={styles.video} />
                );
            })}
        
        </View>
    );
      
};


export default ViewerPage;
