//import io from "socket.io-client";

//export const socket = io("http://192.168.1.90:3000"); // URL del signaling server MAC

//export const socket = io("https://192.168.1.90:3000");



import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.log('Errore nel recupero del token:', error);
    return null;
  }
};

export const initializeSocket = async () => {
  if (!socket || !socket.connected) {
    const token = await getToken();
    if (token) {
      socket = io('https://192.168.1.90:3000', {
        auth: { token },
        //transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Socket connesso con successo');
        console.log('Socket:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.log('Errore di connessione:', err);
      });

      socket.on('disconnect', () => {
        console.log(' Socket disconnesso');
      });
    } else {
      console.log('Token non trovato, impossibile connettersi al socket');
      const error = new Error('Token non trovato, impossibile connettersi al socket');
      throw error;
    }
  }
  return socket;
};

// Funzione per ottenere il socket quando serve
export const getSocket = () => {
  if (!socket) {
    console.warn('Il socket non è ancora stato inizializzato. Assicurati di chiamare initializeSocket prima!');
  }
  return socket;
};









//export const socket = io("http://100.102.75.2:3000"); // URL del signaling server UNINA 

//export const socket = io("http://172.20.10.2:3000"); // URL del signaling server HOTSPOT

//export const socket = io("http://192.168.1.73:3000"); // URL del signaling server WINDOWS 

