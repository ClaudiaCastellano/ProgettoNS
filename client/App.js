import React, { useState, useEffect } from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from "./pages/Home";
import BroadcasterPage from "./pages/Broadcaster";
import ViewerPage from "./pages/Viewer";
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from "react-native"; // Loader per il caricamento
import { initializeSocket, getSocket } from './pages/signaling';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Stato per mostrare il caricamento
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');

  const Stack = createStackNavigator();

  const setupSocket = async () => {
    try {
      await initializeSocket(); // Inizializza la socket
      const socketInstance = getSocket(); // Ottiene l'istanza della socket
      setSocket(socketInstance); // Imposta la socket nell'app
  
    
      if (socketInstance) {
        socketInstance.on("connect", () => {
          setIsAuthenticated(true); // Se la socket è stato inizializzata, l'utente è autenticato
          // Listener per ricevere il nome utente
          socketInstance.on("username", (username) => {
            setUsername(username); // Salva il nome utente
            setIsLoading(false); // Imposta isLoading a false
          } );
          
        });

        // Gestione errore di connessione
        socketInstance.on("connect_error", (err) => {
          console.log("Errore di connessione:", err);
  
          // Se il token è non valido, rimuove il token e disconnette la socket
          if (err.message === "Token non valido") {
            console.log("Token scaduto, disconnetto la socket");
            AsyncStorage.removeItem('token'); // Rimuove il token scaduto
            socketInstance.disconnect(); // Disconnette la socket
            setIsAuthenticated(false); // Segna l'utente come non autenticato
          }
          setIsLoading(false); // Imposta isLoading a false
        });
      }
    } catch (error) {
      setIsAuthenticated(false); // In caso di errore, imposta l'utente come non autenticato
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    setupSocket(); // Inizializza la socket
  }, []);
  

  if (isLoading) {
    // Mostra un loader mentre controlla l'autenticazione
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ 
          headerLeft: () => null, 
          gestureEnabled: false 
        }}/>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={Home} options={{ 
          headerLeft: () => null, 
          gestureEnabled: false 
        }} initialParams={{ username: username }} />
        <Stack.Screen name="Viewer" component={ViewerPage} />
        <Stack.Screen name="Broadcast" component={BroadcasterPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;


