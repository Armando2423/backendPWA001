const mongoose = require('mongoose');

const UserSchema  = new mongoose.Schema({
    name : String,
    app: String,
    apm: String,
    email:  {type: String, unique: true},
    pwd: { type: String, required: true },
    rol: { type: String, default: 'user' } // Si no se proporciona, será "user"
});

module.exports = mongoose.model('User', UserSchema);