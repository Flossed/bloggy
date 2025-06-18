const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Article = require('../models/Article');
const Analytics = require('../models/Analytics');
const { ensureAuthenticated, ensureOwnership, trackAnalytics } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Dashboard - list user's articles
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    
    res.render('blog/dashboard', {
      title: 'Dashboard',
      articles
    });
  } catch (error) {
    global.logger.error('Dashboard error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load dashboard' });
  }
});

// Create new article page
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('blog/editor', {
    title: 'Create New Article',
    article: null,
    action: '/blog/create'
  });
});

// Create article POST
router.post('/create', ensureAuthenticated, upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, content, excerpt, tags, status, metaTitle, metaDescription, metaKeywords } = req.body;
    
    // Debug logging
    global.logger.info('Creating article with content length:', content ? content.length : 0);
    
    // Ensure content is not empty
    if (!content || content.trim() === '' || content === '<p><br></p>') {
      return res.status(400).render('error', { 
        title: 'Error', 
        error: 'Article content is required' 
      });
    }
    
    const article = new Article({
      author: req.user._id,
      title,
      content,
      excerpt,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: status || 'draft',
      featuredImage: req.file ? `/uploads/${req.file.filename}` : null,
      seo: {
        metaTitle,
        metaDescription,
        metaKeywords: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : []
      }
    });
    
    await article.save();
    res.redirect('/blog/dashboard');
  } catch (error) {
    global.logger.error('Create article error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to create article' });
  }
});

// Edit article page
router.get('/edit/:id', ensureAuthenticated, ensureOwnership(Article), async (req, res) => {
  res.render('blog/editor', {
    title: 'Edit Article',
    article: req.resource,
    action: `/blog/update/${req.resource._id}`
  });
});

// Update article POST
router.post('/update/:id', ensureAuthenticated, ensureOwnership(Article), upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, content, excerpt, tags, status, metaTitle, metaDescription, metaKeywords } = req.body;
    const article = req.resource;
    
    article.title = title;
    article.content = content;
    article.excerpt = excerpt;
    article.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    article.status = status || 'draft';
    
    if (req.file) {
      article.featuredImage = `/uploads/${req.file.filename}`;
    }
    
    article.seo = {
      metaTitle,
      metaDescription,
      metaKeywords: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : []
    };
    
    await article.save();
    res.redirect('/blog/dashboard');
  } catch (error) {
    global.logger.error('Update article error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to update article' });
  }
});

// View article (public)
router.get('/article/:slug', trackAnalytics, async (req, res) => {
  try {
    const article = await Article.findOne({ 
      slug: req.params.slug,
      status: 'published'
    }).populate('author', 'username blogSpace');
    
    if (!article) {
      return res.status(404).render('error', { title: 'Error', error: 'Article not found' });
    }
    
    res.render('blog/article', {
      title: article.title,
      article
    });
  } catch (error) {
    global.logger.error('View article error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load article' });
  }
});

// User's public blog
router.get('/user/:username', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ username: req.params.username, isActive: true });
    
    if (!user) {
      return res.status(404).render('error', { title: 'Error', error: 'User not found' });
    }
    
    const articles = await Article.find({ 
      author: user._id,
      status: 'published'
    }).sort({ publishedAt: -1 });
    
    res.render('blog/user-blog', {
      title: user.blogSpace.title,
      user,
      articles
    });
  } catch (error) {
    global.logger.error('User blog error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load blog' });
  }
});

// Analytics page
router.get('/analytics/:id', ensureAuthenticated, ensureOwnership(Article), async (req, res) => {
  try {
    const article = req.resource;
    
    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const analytics = await Analytics.find({
      article: article._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    res.render('blog/analytics', {
      title: `Analytics - ${article.title}`,
      article,
      analytics
    });
  } catch (error) {
    global.logger.error('Analytics error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load analytics' });
  }
});

// Delete article
router.post('/delete/:id', ensureAuthenticated, ensureOwnership(Article), async (req, res) => {
  try {
    await req.resource.remove();
    res.redirect('/blog/dashboard');
  } catch (error) {
    global.logger.error('Delete article error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to delete article' });
  }
});

module.exports = router;
