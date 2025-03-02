const mongoose = require('mongoose');

const activeTokensSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // Riferimento all'utente
    token: {type: String, required: true, unique: true}, // Token attivo
    createdAt: {type: Date, default: Date.now, expires: 600} // Scadenza del token
});

const ActiveTokens = mongoose.model('ActiveTokens', activeTokensSchema);

module.exports = ActiveTokens;