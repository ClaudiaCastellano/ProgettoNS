import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View,Text,TextInput, TouchableOpacity, FlatList, Modal, BackHandler} from "react-native";
import { homestyle } from "./styles";
import { initializeSocket, getSocket } from './signaling';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = ({ route, navigation }) => {
  const initialUser = route.params.username || '';
  const [streamId, setStreamId] = useState("");
  const [availableStreams, setAvailableStreams] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState(initialUser);

  useEffect(() => {
    const setupSocket = async () => {
      await initializeSocket();
      const socketInstance = getSocket();
      setSocket(socketInstance);

      if (socketInstance) {
        socketInstance.on("username", (username) => {
          setUsername(username);
        });
        socketInstance.on("available-streams", (streams) => {
          setAvailableStreams(streams);
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

  const fetchAvailableStreams = () => {
    socket.emit("get-streams");
    setModalVisible(true);
  };

  const joinStream = (selectedId) => {
    setModalVisible(false);
    navigation.navigate("Viewer", { streamId: selectedId, username: username });
  };

  const startBroadcast = () => {
    if (streamId.trim() !== "") {
      navigation.navigate("Broadcast", { streamId , username: username });
      setStreamId("");
      setShowInput(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token'); // Elimina il token
      console.log('Token rimosso');
      socket.disconnect(); // Disconnetti il socket
      console.log('Socket disconnesso', socket);
      navigation.navigate("Login"); // Torna alla schermata di login
    } catch (error) {
      console.log('Errore nel logout:', error);
    }
  };

  return (
    <View style={homestyle.container}>
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
  );
};



export default Home;

