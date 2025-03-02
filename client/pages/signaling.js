import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

let socket = null;

// Funzione per ottenere il token da AsyncStorage
const getToken = async () => {
  try {
    // Recupera il token da AsyncStorage
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    // In caso di errore, mostra un messaggio di errore
    console.log('Errore nel recupero del token:', error);
    return null;
  }
};

// Funzione per inizializzare la socket
export const initializeSocket = async () => {
  // Se la socket non è già stata inizializzata o è disconnessa, inizializza la socket
  if (!socket || !socket.connected) {
    // Ottiene il token da AsyncStorage
    const token = await getToken();
    // Se il token è presente, inizializza la socket
    if (token) {
      socket = io(config.signalingServer, {
        auth: { token },
      });

      // Gestione dell'evento di connessione 
      socket.on('connect', () => {
        console.log('Socket connesso con successo');
        console.log('Socket:', socket.id);
      });

      // Gestione dell'evento di errore di connessione
      socket.on('connect_error', (err) => {
        console.log('Errore di connessione:', err);
      });

      // Gestione dell'evento di disconnessione
      socket.on('disconnect', () => {
        console.log(' Socket disconnesso');
      });
    } else {
      // Se il token non è presente, mostra un messaggio di errore
      console.log('Token non trovato, impossibile connettersi alla socket');
      const error = new Error('Token non trovato, impossibile connettersi al socket');
      throw error;
    }
  }
  // Restituisce la socket se è già stata inizializzata
  return socket;
};

// Funzione per ottenere la socket quando serve
export const getSocket = () => {
  // Se la socket non è stata inizializzata, mostra un messaggio di errore
  if (!socket) {
    console.warn('Il socket non è ancora stato inizializzato. Assicurati di chiamare initializeSocket prima!');
  }
  return socket;
};
 

