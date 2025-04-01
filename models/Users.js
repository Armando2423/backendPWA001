const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    app: String,
    apm: String,
    email: { type: String, unique: true, required: true },
    pwd: { type: String, required: true },
    rol: { type: String, default: 'user' }, // Si no se proporciona, será "user"
    subscription: {
        endpoint: String,
        expirationTime: Date,
        keys: {
            p256dh: String,
            auth: String
        }
    }
});

module.exports = mongoose.model('User', UserSchema);
