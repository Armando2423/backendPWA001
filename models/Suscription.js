const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  expirationTime: { type: Date },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;