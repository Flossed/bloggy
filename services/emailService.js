const nodemailer = require('nodemailer');
const User = require('../models/User');
const Article = require('../models/Article');
const Analytics = require('../models/Analytics');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send analytics email to a user
exports.sendAnalyticsEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.emailNotifications.analytics) return;
    
    // Get user's articles
    const articles = await Article.find({ 
      author: userId,
      status: 'published'
    });
    
    if (articles.length === 0) return;
    
    // Get analytics for the period based on frequency
    const daysMap = {
      daily: 1,
      weekly: 7,
      monthly: 30
    };
    
    const days = daysMap[user.emailNotifications.frequency];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Aggregate analytics data
    let totalViews = 0;
    let totalLikes = 0;
    let articleStats = [];
    
    for (const article of articles) {
      const analytics = await Analytics.aggregate([
        {
          $match: {
            article: article._id,
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            uniqueVisitors: { $sum: { $size: "$uniqueVisitors" } }
          }
        }
      ]);
      
      const stats = analytics[0] || { totalViews: 0, uniqueVisitors: 0 };
      const likesInPeriod = article.likes; // This would need modification to track likes over time
      
      totalViews += stats.totalViews;
      totalLikes += likesInPeriod;
      
      articleStats.push({
        title: article.title,
        views: stats.totalViews,
        uniqueVisitors: stats.uniqueVisitors,
        likes: likesInPeriod,
        rating: article.averageRating
      });
    }
    
    // Sort by views
    articleStats.sort((a, b) => b.views - a.views);
    
    // Create email content
    const emailHtml = `
      <h2>Your Bloggy Analytics Report</h2>
      <p>Hi ${user.username},</p>
      <p>Here's your ${user.emailNotifications.frequency} analytics summary:</p>
      
      <h3>Overall Stats</h3>
      <ul>
        <li>Total Views: ${totalViews}</li>
        <li>Total Likes: ${totalLikes}</li>
      </ul>
      
      <h3>Top Articles</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Article</th>
            <th>Views</th>
            <th>Unique Visitors</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          ${articleStats.slice(0, 10).map(stat => `
            <tr>
              <td>${stat.title}</td>
              <td>${stat.views}</td>
              <td>${stat.uniqueVisitors}</td>
              <td>${stat.rating.toFixed(1)}/10</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p>Keep up the great work!</p>
      <p>The Bloggy Team</p>
    `;
    
    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Bloggy <noreply@bloggy.com>',
      to: user.email,
      subject: `Your ${user.emailNotifications.frequency} Bloggy Analytics Report`,
      html: emailHtml
    });
    
    global.logger.info(`Analytics email sent to ${user.email}`);
  } catch (error) {
    global.logger.error('Failed to send analytics email:', error);
  }
};

// Send bulk analytics emails based on frequency
exports.sendBulkAnalyticsEmails = async (frequency) => {
  try {
    const users = await User.find({
      'emailNotifications.analytics': true,
      'emailNotifications.frequency': frequency,
      isActive: true
    });
    
    for (const user of users) {
      await exports.sendAnalyticsEmail(user._id);
    }
    
    global.logger.info(`Sent ${users.length} ${frequency} analytics emails`);
  } catch (error) {
    global.logger.error('Failed to send bulk analytics emails:', error);
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, token, host) => {
  try {
    const resetUrl = `http://${host}/auth/reset/${token}`;
    
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.username},</p>
      <p>You are receiving this email because you (or someone else) requested a password reset for your Bloggy account.</p>
      <p>Please click on the following link, or paste it into your browser to complete the process:</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy and paste this link:</p>
      <p>${resetUrl}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The Bloggy Team</p>
    `;
    
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Bloggy <noreply@bloggy.com>',
      to: user.email,
      subject: 'Bloggy - Password Reset Request',
      html: emailHtml,
      text: `Hi ${user.username},\n\nYou requested a password reset. Please visit the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThe Bloggy Team`
    });
    
    global.logger.info(`Password reset email sent to ${user.email}`);
  } catch (error) {
    global.logger.error('Failed to send password reset email:', error);
    throw error;
  }
};

// Send password reset confirmation email
exports.sendPasswordResetConfirmationEmail = async (user) => {
  try {
    const emailHtml = `
      <h2>Password Successfully Reset</h2>
      <p>Hi ${user.username},</p>
      <p>This is a confirmation that the password for your Bloggy account has been successfully changed.</p>
      <p>If you did not make this change, please contact us immediately.</p>
      <p>For security reasons, we recommend that you:</p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Never share your password with anyone</li>
        <li>Change your password regularly</li>
      </ul>
      <p>Best regards,<br>The Bloggy Team</p>
    `;
    
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Bloggy <noreply@bloggy.com>',
      to: user.email,
      subject: 'Bloggy - Password Changed Successfully',
      html: emailHtml,
      text: `Hi ${user.username},\n\nThis is a confirmation that your Bloggy password has been successfully changed.\n\nIf you did not make this change, please contact us immediately.\n\nThe Bloggy Team`
    });
    
    global.logger.info(`Password reset confirmation email sent to ${user.email}`);
  } catch (error) {
    global.logger.error('Failed to send password reset confirmation email:', error);
    // Don't throw error as this is not critical
  }
};
