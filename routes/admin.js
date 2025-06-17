const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Article = require('../models/Article');
const Analytics = require('../models/Analytics');
const { ensureAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const articleCount = await Article.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const publishedArticles = await Article.countDocuments({ status: 'published' });
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        userCount,
        articleCount,
        activeUsers,
        publishedArticles
      }
    });
  } catch (error) {
    global.logger.error('Admin dashboard error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load admin dashboard' });
  }
});

// Users management
router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('admin/users', {
      title: 'Manage Users',
      users
    });
  } catch (error) {
    global.logger.error('Admin users error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load users' });
  }
});

// Toggle user status
router.post('/users/:id/toggle', ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow admin to deactivate themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    global.logger.error('Toggle user error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// Delete user
router.post('/users/:id/delete', ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Archive all user's articles
    await Article.updateMany(
      { author: user._id },
      { status: 'archived' }
    );
    
    // Deactivate user instead of deleting
    user.isActive = false;
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    global.logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Articles management
router.get('/articles', ensureAdmin, async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 });
    
    res.render('admin/articles', {
      title: 'Manage Articles',
      articles
    });
  } catch (error) {
    global.logger.error('Admin articles error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load articles' });
  }
});

// Archive/unarchive article
router.post('/articles/:id/archive', ensureAdmin, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    article.status = article.status === 'archived' ? 'published' : 'archived';
    await article.save();
    
    res.json({ success: true, status: article.status });
  } catch (error) {
    global.logger.error('Archive article error:', error);
    res.status(500).json({ error: 'Failed to archive article' });
  }
});

// Global analytics
router.get('/analytics', ensureAdmin, async (req, res) => {
  try {
    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const analytics = await Analytics.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalViews: { $sum: "$views" },
          uniqueVisitors: { $sum: { $size: "$uniqueVisitors" } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top articles
    const topArticles = await Article.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .populate('author', 'username');
    
    res.render('admin/analytics', {
      title: 'Global Analytics',
      analytics,
      topArticles
    });
  } catch (error) {
    global.logger.error('Admin analytics error:', error);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load analytics' });
  }
});

module.exports = router;
