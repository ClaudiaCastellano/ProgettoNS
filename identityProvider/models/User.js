const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true, maxlength: 30, match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/},
    password: {type: String, required: true},
    loginAttempts: {type: Number, required: true, default: 0},
    lockUntil: {type: Date},
});

userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

const User = mongoose.model('User', userSchema);

module.exports = User;