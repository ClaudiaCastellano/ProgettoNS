import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import {authStyles} from './styles';

// Creazione del functional component RegisterScreen
const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState(''); // Stato per l'email
  const [password, setPassword] = useState('');  // Stato per la password
  const [confirmPassword, setConfirmPassword] = useState(''); // Stato per la conferma della password

  // Funzione per gestire la registrazione
  const handleRegister = async () => {
    // Controlla se le password corrispondono
    if (password !== confirmPassword) {
      return Alert.alert('Errore', 'Le password non corrispondono');
    }

    try {
      // Chiamata POST all'endpoint di registrazione con email e password
      const response = await axios.post('https://192.168.1.90:4000/register', { email, password });
      
      //Naviga alla schermata di login dopo la registrazione
      navigation.replace('Login');
    } catch (error) {
      // In caso di errore, mostra un alert con il messaggio di errore
      console.log('error', error);
      Alert.alert('Errore nella registrazione', error.response?.data?.error || 'Errore sconosciuto');
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Registrazione</Text>
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
      <TextInput 
        style={authStyles.input} 
        placeholder="Conferma Password" 
        placeholderTextColor="#bbb"
        secureTextEntry 
        value={confirmPassword} 
        onChangeText={setConfirmPassword} 
      />
      <TouchableOpacity style={authStyles.button} onPress={handleRegister}>
        <Text style={authStyles.buttonText}>Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={authStyles.linkText}>Hai già un account? Accedi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;
