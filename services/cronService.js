const cron = require('node-cron');
const { sendBulkAnalyticsEmails } = require('./emailService');

exports.startCronJobs = () => {
  // Daily analytics emails - every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    global.logger.info('Running daily analytics email job');
    await sendBulkAnalyticsEmails('daily');
  });

  // Weekly analytics emails - every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    global.logger.info('Running weekly analytics email job');
    await sendBulkAnalyticsEmails('weekly');
  });

  // Monthly analytics emails - first day of month at 9 AM
  cron.schedule('0 9 1 * *', async () => {
    global.logger.info('Running monthly analytics email job');
    await sendBulkAnalyticsEmails('monthly');
  });

  // Clean up old analytics data - every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const Analytics = require('../models/Analytics');
      
      // Keep only last 90 days of analytics
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await Analytics.deleteMany({
        date: { $lt: ninetyDaysAgo }
      });
      
      global.logger.info(`Cleaned up ${result.deletedCount} old analytics records`);
    } catch (error) {
      global.logger.error('Analytics cleanup error:', error);
    }
  });

  global.logger.info('Cron jobs initialized');
};
