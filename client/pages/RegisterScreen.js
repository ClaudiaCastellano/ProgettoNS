import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import {authStyles} from './styles';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Errore', 'Le password non corrispondono');
    }

    try {
      const response = await axios.post('https://192.168.1.90:4000/register', { email, password });
      
      //Naviga alla schermata di login dopo la registrazione
      navigation.replace('Login');
    } catch (error) {
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
