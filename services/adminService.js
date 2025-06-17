const User = require('../models/User');

// Initialize admin user on first run
exports.initializeAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bloggy.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const admin = new User({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        blogSpace: {
          title: 'Admin Blog',
          description: 'Platform administration blog'
        }
      });
      
      await admin.save();
      global.logger.info('Admin user created successfully');
    }
  } catch (error) {
    global.logger.error('Failed to initialize admin:', error);
  }
};
