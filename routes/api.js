const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Analytics = require('../models/Analytics');

// API endpoint to like an article
router.post('/article/:id/like', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article || article.status !== 'published') {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    article.likes += 1;
    await article.save();
    
    res.json({ success: true, likes: article.likes });
  } catch (error) {
    global.logger.error('Like article error:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
});

// API endpoint to rate an article
router.post('/article/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    const article = await Article.findById(req.params.id);
    
    if (!article || article.status !== 'published') {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    await article.addRating(parseInt(rating), ipAddress);
    
    res.json({ 
      success: true, 
      averageRating: article.averageRating,
      totalRatings: article.ratings.length
    });
  } catch (error) {
    global.logger.error('Rate article error:', error);
    res.status(500).json({ error: 'Failed to rate article' });
  }
});

// API endpoint to search articles
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const skip = (page - 1) * limit;
    
    const articles = await Article.find({
      $and: [
        { status: 'published' },
        { $text: { $search: q } }
      ]
    })
    .select('title slug excerpt author publishedAt views likes averageRating')
    .populate('author', 'username')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Article.countDocuments({
      $and: [
        { status: 'published' },
        { $text: { $search: q } }
      ]
    });
    
    res.json({
      articles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    global.logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// API endpoint to get popular articles
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const articles = await Article.find({ status: 'published' })
      .select('title slug excerpt author publishedAt views likes averageRating')
      .populate('author', 'username')
      .sort({ views: -1, averageRating: -1 })
      .limit(parseInt(limit));
    
    res.json({ articles });
  } catch (error) {
    global.logger.error('Popular articles error:', error);
    res.status(500).json({ error: 'Failed to get popular articles' });
  }
});

// API endpoint to get article statistics
router.get('/article/:id/stats', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .select('views likes ratings averageRating');
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Get daily views for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await Analytics.aggregate([
      {
        $match: {
          article: article._id,
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          views: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json({
      totalViews: article.views,
      likes: article.likes,
      averageRating: article.averageRating,
      totalRatings: article.ratings.length,
      dailyStats
    });
  } catch (error) {
    global.logger.error('Article stats error:', error);
    res.status(500).json({ error: 'Failed to get article statistics' });
  }
});

module.exports = router;
