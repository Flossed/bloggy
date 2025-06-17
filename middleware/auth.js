// Middleware to ensure user is authenticated
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

// Middleware to ensure user is admin
exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', { title: 'Access Denied', error: 'Access denied. Admin privileges required.' });
};

// Middleware to ensure user owns the resource
exports.ensureOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).render('error', { title: 'Not Found', error: 'Resource not found' });
      }
      
      // Check if user is admin or owner
      if (req.user.role === 'admin' || resource.author.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }
      
      res.status(403).render('error', { title: 'Permission Denied', error: 'You do not have permission to access this resource' });
    } catch (error) {
      global.logger.error('Ownership check error:', error);
      res.status(500).render('error', { title: 'Server Error', error: 'Server error' });
    }
  };
};

// Middleware to track analytics
exports.trackAnalytics = async (req, res, next) => {
  if (req.params.slug) {
    try {
      const Article = require('../models/Article');
      const Analytics = require('../models/Analytics');
      
      const article = await Article.findOne({ slug: req.params.slug, status: 'published' });
      
      if (article && !req.user) { // Only track for non-authenticated users
        // Get or create today's analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let analytics = await Analytics.findOne({
          article: article._id,
          date: today
        });
        
        if (!analytics) {
          analytics = new Analytics({
            article: article._id,
            date: today
          });
        }
        
        // Add view
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const referrer = req.get('referrer');
        
        await analytics.addView(ipAddress, userAgent, referrer);
        await article.incrementViews();
      }
    } catch (error) {
      global.logger.error('Analytics tracking error:', error);
    }
  }
  next();
};
