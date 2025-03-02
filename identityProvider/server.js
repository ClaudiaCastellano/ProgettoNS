require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
const User = require('./models/User');
const ActiveTokens = require('./models/ActiveTokens');

const app = express();
app.use(express.json());


// Connessione a MongoDB
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connesso a MongoDB'))
  .catch(err => console.error('Errore di connessione a MongoDB:', err));

// Registrazione utente
app.post('/register', async (req, res) => {
  console.log('register', req.body);
  const { email, password } = req.body;

  try {
    // Verifica se l'email è già presente nel database
    const userExists = await User.findOne({ email });
    // Se l'utente esiste, restituisce un errore
    if (userExists) return res.status(400).json({ error: 'Utente già esistente' });

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva l'utente nel database
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Utente registrato!' });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante la registrazione' });
  }
});

// Login utente
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Trova l'utente nel database
    const user = await User.findOne({email });
    if (!user) return res.status(400).json({ error: 'Utente non trovato' });

    // Confronta la password hashata
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Password errata' });

    // Genera il token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: 600 });
    await ActiveTokens.create({ userId: user._id, token });
    console.log('Token generato e salvato:', token);
    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// Middleware di autenticazione
const authenticate = async (req, res, next) => {
  console.log('autenticando...');
  // Estrae il token dall'header
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Token richiesto' });

  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Verifica se il token è attivo
    const activeToken = await ActiveTokens.findOne({ userId: decoded.userId, token });
    // Se il token non è attivo, restituisce un errore
    if (!activeToken) {
      console.log('Token non valido o revocato');
      return res.status(401).json({ error: 'Token non valido o revocato' });
    }
    // Salva i dati utente nell'oggetto req
    req.user = decoded;
    console.log('Utente autenticato:', req.user);
    next();
  } catch {
    console.log('Token non valido');
    res.status(401).json({ error: 'Token non valido' });
  } 
};

// Logout utente
app.post('/logout', async (req, res) => {
  try {
    // Estrae il token dall'header
    const token = req.headers.authorization.split('Bearer ')[1];
    if(!token){
      return res.status(401).json({ error: 'Token mancante' });
    } 
    // Verifica se il token è attivo
    const activeToken = await ActiveTokens.findOne({ token });
    if(activeToken){
      await activeToken.deleteOne({token }); // Elimina il token attivo
      return res.status(200).json({ message: 'Logout effettuato' });
    }else{
      return res.status(200).json({ message: 'Token già scaduto o revocato' }); 
    }
  } catch (error) {
    res.status(500).json({ error: 'Errore durante il logout' });
  }
});

// Endpoint protetto che richiede autenticazione
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Accesso autorizzato!', user: req.user });
});

const privateKey = fs.readFileSync('../certificati/172.20.10.2-key.pem', 'utf8');
const certificate = fs.readFileSync('../certificati/172.20.10.2.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Avvio del server
https.createServer(credentials, app).listen(4000, () => {
  console.log('Server attivo su https://localhost:4000');
});


