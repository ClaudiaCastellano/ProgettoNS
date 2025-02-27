import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  AppState,
} from "react-native";
import { RTCView, mediaDevices, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { getSocket } from "./signaling";
import {broadcasterStyle} from "./styles";


const BroadcasterPage = ({ route, navigation }) => {
    const { streamId, username } = route.params;
    const [stream, setStream] = useState(null);
    const peerConnections = useRef({}); 
    const [error, setError] = useState(null);
    const [errorShown, setErrorShown] = useState(false); 
    const [isFront, setIsFront] = useState(true); // Stato per la fotocamera
    const localStream = useRef(null);
    const [userCount, setUserCount] = useState(0);

    const socket = getSocket();

    useEffect(() => {
        if (error && !errorShown) {
            // Mostra l'alert solo se l'errore non è stato ancora mostrato
            Alert.alert("Errore", error, [{ text: "OK", onPress: () => {
                setError(null);
                setErrorShown(true);  // Imposta flag a true dopo aver mostrato l'alert
                navigation.navigate("Home", { username });
            }}]);
        }
    }, [error, errorShown]);

    const getStream = async (facing) => {
        try {
            const localStream = await mediaDevices.getUserMedia({
                video: { facingMode: facing ? "user" : "environment" },
                audio: true
            });

            return localStream;
        } catch (error) {
            setError("Autorizzazione necessaria. Per continuare consenti l'accesso alla fotocamera e al microfono dalle impostazioni del dispositivo.");
        }
    };

    useEffect(() => {
        
        const startBroadcast = async () => {
            console.log("Sono il broadcaster dello stream:", streamId);

            localStream.current = await getStream(isFront);
            setStream(localStream.current);
            if (!localStream.current) return;

            socket.emit("start-broadcast", streamId);


            socket.on("signal", async ({ from, signal }) => {
                console.log("Ricevuto segnale:", signal);
                const pc = peerConnections.current[from];
                if (!pc) {
                    console.warn(`Connessione peer non trovata per viewer ${from}`);
                    return;
                }
        
                if (signal.candidate) {
                    console.log(`Aggiungo ICE Candidate dal viewer ${from}`);
                    await pc.addIceCandidate(signal);
                } else if (signal.type === "answer") {
                    console.log(`Ricevuta risposta SDP dal viewer ${from}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                }
                    
            });
            
            socket.on("join-viewer", async (viewerId) => {

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
                await pc.setLocalDescription(offer);
                console.log(`Invio offerta SDP al viewer ${viewerId}`);
                socket.emit("signal", { streamId, to: viewerId, signal: offer });
    
                // Aggiungi la connessione al registro
                peerConnections.current[viewerId] = pc;
                        
            });
            

            socket.on("user-count", (count) => {
                console.log("Utenti connessi:", count);
                setUserCount(count-1);
            });

            socket.on("viewer-disconnect", (viewerId) => {
                console.log(`Viewer disconnesso: ${viewerId}`);
                const pc = peerConnections.current[viewerId];
                if (pc) {
                    pc.close();
                    delete peerConnections.current[viewerId];
                }
            });

            socket.on("error-broadcaster", () => {
                setError("ID diretta già utilizzato");
            });
        
        };

        startBroadcast();

        return () => {
            socket.emit("leave-broadcast", streamId);
            console.log("ho invocato leave broadcast");
            Object.values(peerConnections.current).forEach((pc) => pc.close());
        };
    }, [streamId, navigation]);

    const toggleCamera = async () => {
        if (!stream) return;

        const newIsFront = !isFront;
        setIsFront(newIsFront);

        const newStream = await getStream(newIsFront);
        if (!newStream) return;

        // Sostituzione dei nuovi track nella connessione peer
        Object.values(peerConnections.current).forEach((pc) => {
            pc.getSenders().forEach((sender) => {
                if (sender.track.kind === "video") {
                    sender.replaceTrack(newStream.getVideoTracks()[0]);
                }
            });
        });

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
