require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors()); // Permette le richieste cross-origin

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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Utente non trovato' });

    // Confronta la password hashata
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Password errata' });

    // Genera il token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
    console.log('Token generato:', token);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// Middleware di autenticazione
const authenticate = (req, res, next) => {
  console.log('autenticando...');
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Token richiesto' });

  try {
    req.user = jwt.verify(token, process.env.SECRET_KEY);
    console.log('Utente autenticato:', req.user);
    next();
  } catch {
    console.log('Token non valido');
    res.status(401).json({ error: 'Token non valido' });
  }
};

// Endpoint protetto che richiede autenticazione
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Accesso autorizzato!', user: req.user });
});

const privateKey = fs.readFileSync('../certificati/192.168.1.90-key.pem', 'utf8');
const certificate = fs.readFileSync('../certificati/192.168.1.90.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Avvio del server
https.createServer(credentials, app).listen(4000, () => {
  console.log('Server attivo su https://localhost:4000');
});

/*app.listen(4000, () => {
  console.log('Server attivo su http://localhost:4000');
});*/
