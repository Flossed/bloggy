// Check if nodemailer is installed
try {
  const nodemailer = require('nodemailer');
  console.log('Nodemailer is installed');
  console.log('Nodemailer version:', require('nodemailer/package.json').version);
  console.log('createTransport is a function:', typeof nodemailer.createTransport === 'function');
} catch (error) {
  console.error('Nodemailer is NOT installed:', error.message);
  console.error('Please run: npm install nodemailer');
}

// Check other dependencies
const deps = ['express', 'mongoose', 'passport', 'bcryptjs', 'ejs'];
deps.forEach(dep => {
  try {
    require(dep);
    console.log(`✓ ${dep} is installed`);
  } catch (e) {
    console.log(`✗ ${dep} is NOT installed`);
  }
});
