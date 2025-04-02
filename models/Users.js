const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    app: String,
    apm: String,
    email: { type: String, unique: true, required: true },
    pwd: { type: String, required: true },
    rol: { type: String, default: 'user' },

    // 📌 Agregamos la suscripción como parte del usuario
    subscription: {
        endpoint: { type: String },
        expirationTime: Date,
        keys: {
            p256dh: { type: String },
            auth: { type: String }
        }
    }
});

module.exports = mongoose.model('User', UserSchema);
