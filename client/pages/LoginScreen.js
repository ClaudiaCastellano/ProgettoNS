import React, { useState, useCallback } from 'react';
import { View, TextInput, BackHandler, Text, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authStyles} from './styles';
import { useFocusEffect } from "@react-navigation/native";

// Creazione del functional component LoginScreen
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(''); // Stato per l'email
  const [password, setPassword] = useState(''); // Stato per la password

  // Funzione per salvare il token in AsyncStorage
  const saveToken = async (token) => {
    try{
        await AsyncStorage.setItem('token', token);
        console.log('token salvato');
    }catch(error){
        console.log('errore nel salvataggio del token', error);
    }
  };

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

  // Funzione per gestire il login
  const handleLogin = async () => {
    try {
      // Chiamata POST all'endpoint di login con email e password
      const response = await axios.post('https://192.168.1.90:4000/login', { email, password });
      console.log('response',response);
      // Estrae il token dalla risposta
      const { token } = response.data;
      console.log('token',token);
      
      // Salva il token in AsyncStorage
        saveToken(token);

      // Naviga alla schermata principale dopo il login riuscito
      navigation.replace('Home');
    } catch (error) {
      // In caso di errore, mostra un alert con il messaggio di errore
      Alert.alert('Errore di login', error.response?.data?.error || 'Errore sconosciuto');
    }
  };

  return (
    <View style={authStyles.container}>
    <Text style={authStyles.title}>Login</Text>
    <TextInput 
      style={authStyles.input} 
      placeholder="Email" 
      placeholderTextColor="#bbb"
      value={email} 
      onChangeText={setEmail} 
    />
    <TextInput 
      style={authStyles.input} 
      placeholder="Password" 
      placeholderTextColor="#bbb"
      secureTextEntry 
      value={password} 
      onChangeText={setPassword} 
    />
    <TouchableOpacity style={authStyles.button} onPress={handleLogin}>
      <Text style={authStyles.buttonText}>Accedi</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
      <Text style={authStyles.linkText}>Non hai un account? Registrati</Text>
    </TouchableOpacity>
  </View>
  );
};

export default LoginScreen;
