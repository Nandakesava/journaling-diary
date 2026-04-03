const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  sentiment: {
    score: { type: Number, default: 0 },
    label: { type: String, default: 'Neutral' },
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    emotions: {
      joy: { type: Number, default: 0 },
      sadness: { type: Number, default: 0 },
      anger: { type: Number, default: 0 },
      fear: { type: Number, default: 0 },
      surprise: { type: Number, default: 0 }
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
