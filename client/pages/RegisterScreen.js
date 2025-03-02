import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import axios from 'axios';
import {authStyles, stylesBackground} from './styles';
import config from './config'

// Creazione del functional component RegisterScreen
const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState(''); // Stato per l'email
  const [password, setPassword] = useState('');  // Stato per la password
  const [confirmPassword, setConfirmPassword] = useState(''); // Stato per la conferma della password
  const registerUrl = `${config.IdP}/register`;

  // Funzione per gestire la registrazione
  const handleRegister = async () => {
    // Controlla se le password corrispondono
    if (password !== confirmPassword) {
      return Alert.alert('Errore', 'Le password non corrispondono');
    }

    try {
      // Chiamata POST all'endpoint di registrazione con email e password
      const response = await axios.post(registerUrl, { email, password });
      
      //Naviga alla schermata di login dopo la registrazione
      navigation.replace('Login');
    } catch (error) {
      // In caso di errore, mostra un alert con il messaggio di errore
      console.log('error', error);
      Alert.alert('Errore', error.response?.data?.error || 'Errore sconosciuto', [{ text: 'OK', onPress: () => navigation.replace('Register') }]);

    }
  };

  return (
      <ImageBackground 
        source={require('./background.jpg')} // Sostituisci con il percorso corretto
        style={stylesBackground.backgroundImage}
      >
        <View style={stylesBackground.overlay}>
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
    </ImageBackground>
  );
};

export default RegisterScreen;
