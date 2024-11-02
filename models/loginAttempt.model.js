const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
  lastAttempt: { type: Date, default: null },
  locked: { type: Boolean, default: false }
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);