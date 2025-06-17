const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Import services
const { initializeAdmin } = require('./services/adminService');
const { startCronJobs } = require('./services/cronService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Make logger globally available
global.logger = logger;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.129.197:27017/bloggy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
  // Initialize admin user if not exists
  initializeAdmin();
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://192.168.129.197:27017/bloggy',
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./config/passport')(passport);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.appVersion = require('./package.json').version;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/blog', blogRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    const Article = require('./models/Article');
    const recentArticles = await Article.find({ 
      status: 'published' 
    })
    .populate('author', 'username')
    .sort({ publishedAt: -1 })
    .limit(10);
    
    res.render('index', { 
      title: 'Welcome to Bloggy',
      articles: recentArticles
    });
  } catch (error) {
    logger.error('Error loading homepage:', error);
    res.status(500).render('error', { error: 'Failed to load articles' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', { error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { error: 'Page not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start cron jobs for analytics emails
  startCronJobs();
});

module.exports = app;
