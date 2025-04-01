const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Relacionar suscripción con usuario
  endpoint: { type: String, required: true },
  expirationTime: { type: Date },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
