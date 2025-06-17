const mongoose = require('mongoose');

const articleVersionSchema = new mongoose.Schema({
  title: String,
  content: String,
  excerpt: String,
  tags: [String],
  featuredImage: String,
  versionNumber: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const articleSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  featuredImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  publishedAt: {
    type: Date
  },
  versions: [articleVersionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  ratings: [{
    value: {
      type: Number,
      min: 1,
      max: 10
    },
    ipAddress: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  }
}, {
  timestamps: true
});

// Index for better search performance
articleSchema.index({ title: 'text', content: 'text', tags: 'text' });
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ slug: 1 });

// Generate slug from title
articleSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Save version before updating
articleSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    const version = {
      title: this.title,
      content: this.content,
      excerpt: this.excerpt,
      tags: this.tags,
      featuredImage: this.featuredImage,
      versionNumber: this.currentVersion
    };
    this.versions.push(version);
    this.currentVersion += 1;
  }
  
  // Update published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Calculate average rating
articleSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
  }
  return this.save();
};

// Increment view count
articleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Add rating
articleSchema.methods.addRating = function(value, ipAddress) {
  // Check if IP already rated
  const existingRating = this.ratings.find(r => r.ipAddress === ipAddress);
  if (existingRating) {
    existingRating.value = value;
    existingRating.createdAt = new Date();
  } else {
    this.ratings.push({ value, ipAddress });
  }
  return this.calculateAverageRating();
};

module.exports = mongoose.model('Article', articleSchema);
