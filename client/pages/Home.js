import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View,Text,TextInput, TouchableOpacity, FlatList, Modal, BackHandler, ImageBackground} from "react-native";
import { homestyle, stylesBackground } from "./styles";
import { initializeSocket, getSocket } from './signaling';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

// Creazione del functional component Home
const Home = ({ route, navigation }) => {
  const initialUser = route.params.username || ''; // Ottiene il nome utente passato come parametro
  const [streamId, setStreamId] = useState(""); // Stato per l'ID della diretta
  const [availableStreams, setAvailableStreams] = useState([]); // Stato per le dirette disponibili
  const [modalVisible, setModalVisible] = useState(false);  // Stato per la visibilità del modal
  const [showInput, setShowInput] = useState(false);  // Stato per mostrare l'input per l'ID della diretta
  const [socket, setSocket] = useState(null); // Stato per la socket
  const [username, setUsername] = useState(initialUser);  // Stato per il nome utente
  const logoutUrl = `${config.IdP}/logout`; // URL per il logout

  useEffect(() => {
    // Funzione per inizializzare la socket
    const setupSocket = async () => {
      await initializeSocket();
      const socketInstance = getSocket(); // Ottiene l'istanza della socket
      setSocket(socketInstance); // Imposta la socket nell'app

      // Se la socket è stata inizializzata, imposta i listener
      if (socketInstance) {
        socketInstance.on("username", (username) => {
          setUsername(username); // Salva il nome utente
        });
        socketInstance.on("available-streams", (streams) => {
          setAvailableStreams(streams); // Salva le dirette disponibili
        });

        socketInstance.on("connect_error", (err) => { // Gestione errore di connessione
          console.error("Errore di connessione:", err);
        });
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off("available-streams");
        socket.off("username");
      }
    };
  }, []);

  // Utilizzo di useFocusEffect per bloccare il tasto "Back" quando il componente è attivo
  useFocusEffect(
    useCallback(() => {
      const backAction = () => true; // Blocca il tasto "Back"
      
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
  
      return () => backHandler.remove();
    }, [])
  );

  // Funzione per ottenere le dirette disponibili
  const fetchAvailableStreams = () => {
    socket.emit("get-streams");
    setModalVisible(true);
  };

  // Funzione per unirsi a una diretta
  const joinStream = (selectedId) => {
    setModalVisible(false);
    navigation.navigate("Viewer", { streamId: selectedId, username: username });
  };

  // Funzione per avviare una diretta
  const startBroadcast = () => {
    if (streamId.trim() !== "") {
      navigation.navigate("Broadcast", { streamId , username: username });
      setStreamId("");
      setShowInput(false);
    }
  };


  const handleLogout = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('Token mancate, utente non autenticato');
      return;
    }

    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('response', response);
      if (response.status === 200) {
        console.log('Logout effettuato');
        await AsyncStorage.removeItem('token');
        socket.disconnect();
        navigation.navigate('Login');
      } else {
        console.log('Errore durante il logout:', response.statusText);
      }
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <ImageBackground 
        source={require('./background.jpg')} // Sostituisci con il percorso corretto
        style={stylesBackground.backgroundImage}
    >
      <View style={stylesBackground.overlay}>
        <Text style={homestyle.title}>Benvenuto!</Text>

        {!showInput ? (
          <TouchableOpacity style={homestyle.button} onPress={() => setShowInput(true)}>
            <Text style={homestyle.buttonText}>Avvia una diretta</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={homestyle.input}
              placeholder="Inserisci ID diretta"
              placeholderTextColor="#aaa"
              value={streamId}
              onChangeText={setStreamId}
            />
            <TouchableOpacity style={homestyle.button} onPress={startBroadcast}>
              <Text style={homestyle.buttonText}>Conferma e Avvia</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={homestyle.buttonSecondary} onPress={fetchAvailableStreams}>
          <Text style={homestyle.buttonText}>Unisciti a una diretta</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={homestyle.modalContainer}>
            <View style={homestyle.modalContent}>
              <Text style={homestyle.modalTitle}>
                {availableStreams.length > 0
                  ? "Seleziona una diretta"
                  : "Non ci sono dirette disponibili"}
              </Text>
              <FlatList
                data={availableStreams}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={homestyle.streamItem} onPress={() => joinStream(item)}>
                    <Text style={homestyle.streamText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={homestyle.buttonChiudi} onPress={() => setModalVisible(false)}>
                <Text style={homestyle.buttonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={homestyle.usernameText}>Utente: {username}</Text>
        <TouchableOpacity style={homestyle.logoutButton} onPress={handleLogout}>
          <Text style={homestyle.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};



export default Home;

