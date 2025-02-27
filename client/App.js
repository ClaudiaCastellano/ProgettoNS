/*import React, { useState, useEffect } from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from "./pages/Home";
import BroadcasterPage from "./pages/Broadcaster";
import ViewerPage from "./pages/Viewer";
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Stato di autenticazione
  const Stack = createStackNavigator();

  const checkAuthentication = async () => {
    const token = await AsyncStorage.getItem('token'); // Recupera il token JWT da AsyncStorage
    if (token) {
      setIsAuthenticated(true); // Se il token è presente, l'utente è autenticato
    } else {
      setIsAuthenticated(false); // Se il token non c'è, l'utente non è autenticato
    }
  };

  useEffect(() => {
    checkAuthentication(); // Verifica se l'utente è autenticato all'inizio
  }, []);

  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
        <Stack.Screen name="Login" component={LoginScreen} /> 
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={Home} options={{ 
          headerLeft: () => null, // Rimuove il pulsante "Back"
          gestureEnabled: false // Disabilita il gesto di swipe-back su iOS
        }}/>
        <Stack.Screen name="Viewer" component={ViewerPage} />
        <Stack.Screen name="Broadcast" component={BroadcasterPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;*/

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
      await initializeSocket(); // Inizializza il socket
      const socketInstance = getSocket(); // Ottieni l'istanza del socket
      setSocket(socketInstance); // Imposta il socket nell'app
  
      if (socketInstance) {
        socketInstance.on("connect", () => {
          setIsAuthenticated(true); // Se il socket è stato inizializzato, l'utente è autenticato
          socketInstance.on("username", (username) => {
            setUsername(username);
            setIsLoading(false); // Imposta isLoading a false
          } );
          
        });

        // Gestione errore di connessione
        socketInstance.on("connect_error", (err) => {
          console.log("Errore di connessione:", err);
  
          // Se il token è non valido, rimuovi il token e disconnetti il socket
          if (err.message === "Token non valido") {
            console.log("Token scaduto, disconnetto il socket");
            AsyncStorage.removeItem('token'); // Rimuove il token scaduto
            socketInstance.disconnect(); // Disconnette il socket
            setIsAuthenticated(false); // Segna l'utente come non autenticato
          }
          setIsLoading(false); // Imposta isLoading a false
        });
      }
    } catch (error) {
      //console.log("Errore durante l'inizializzazione del socket", error);
      setIsAuthenticated(false); // In caso di errore, l'utente non è autenticato
      setIsLoading(false);
    }
  };
  

  

  /*const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token); // Se il token esiste, autentica l'utente
    } catch (error) {
      console.error("Errore nel recupero del token:", error);
    } finally {
      setIsLoading(false); // Dopo il controllo, smetti di caricare
    }
  };*/

  useEffect(() => {
    setupSocket();
    //checkAuthentication();
  }, []);
  

  if (isLoading) {
    // Mostra un loader mentre controlliamo l'autenticazione
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


