const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['trip', 'party', 'dinner', 'meeting', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
 participants: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['organizer', 'co-organizer', 'participant'], default: 'participant' },
  joinedAt: { type: Date, default: Date.now }
}],
pendingJoinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

eventSchema.index({ organizer: 1, startDate: -1 });
eventSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Event', eventSchema);