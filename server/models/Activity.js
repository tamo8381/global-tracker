const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'company:create', 'person:update'
  user: { type: String }, // user id or name who performed the action
  timestamp: { type: Date, default: Date.now },
  details: { type: String, trim: true },
  visible: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }, // higher shows first
  meta: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

activitySchema.index({ type: 1 });
activitySchema.index({ timestamp: -1 });
activitySchema.index({ priority: -1 });

module.exports = mongoose.model('Activity', activitySchema);
