const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueVisitors: [{
    ipAddress: String,
    userAgent: String,
    timestamp: Date
  }],
  likes: {
    type: Number,
    default: 0
  },
  ratings: [{
    value: Number,
    timestamp: Date
  }],
  referrers: [{
    url: String,
    count: Number
  }],
  devices: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },
  browsers: [{
    name: String,
    count: Number
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ article: 1, date: -1 });

// Method to add a view
analyticsSchema.methods.addView = function(ipAddress, userAgent, referrer) {
  this.views += 1;
  
  // Check if unique visitor
  const isUnique = !this.uniqueVisitors.find(v => v.ipAddress === ipAddress);
  if (isUnique) {
    this.uniqueVisitors.push({
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  }
  
  // Track referrer
  if (referrer) {
    const existingReferrer = this.referrers.find(r => r.url === referrer);
    if (existingReferrer) {
      existingReferrer.count += 1;
    } else {
      this.referrers.push({ url: referrer, count: 1 });
    }
  }
  
  // Track device type
  const deviceType = this.detectDeviceType(userAgent);
  this.devices[deviceType] += 1;
  
  return this.save();
};

// Helper method to detect device type
analyticsSchema.methods.detectDeviceType = function(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

module.exports = mongoose.model('Analytics', analyticsSchema);
