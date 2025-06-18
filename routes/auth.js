const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } = require('../services/emailService');

// Login page
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/blog/dashboard');
  }
  res.render('auth/login', { 
    title: 'Login'
  });
});

// Login POST
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/blog/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

// Register page
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/blog/dashboard');
  }
  res.render('auth/register', { 
    title: 'Register'
  });
});

// Register POST
router.post('/register', passport.authenticate('local-signup', {
  successRedirect: '/blog/dashboard',
  failureRedirect: '/auth/register',
  failureFlash: true
}));

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      global.logger.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Forgot password page
router.get('/forgot', (req, res) => {
  res.render('auth/forgot', {
    title: 'Forgot Password'
  });
});

// Forgot password POST
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      req.flash('error', 'No account with that email address exists.');
      return res.redirect('/auth/forgot');
    }
    
    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set reset token and expiry (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send email
    await sendPasswordResetEmail(user, token, req.headers.host);
    
    req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
    res.redirect('/auth/login');
  } catch (error) {
    global.logger.error('Forgot password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/auth/forgot');
  }
});

// Reset password page
router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/auth/forgot');
    }
    
    res.render('auth/reset', {
      title: 'Reset Password',
      token: req.params.token
    });
  } catch (error) {
    global.logger.error('Reset password page error:', error);
    res.redirect('/auth/forgot');
  }
});

// Reset password POST
router.post('/reset/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('back');
    }
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/auth/forgot');
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Send confirmation email
    await sendPasswordResetConfirmationEmail(user);
    
    // Auto-login the user
    req.login(user, (err) => {
      if (err) {
        global.logger.error('Auto-login error:', err);
        req.flash('success', 'Your password has been changed. Please login.');
        return res.redirect('/auth/login');
      }
      
      req.flash('success', 'Success! Your password has been changed.');
      res.redirect('/blog/dashboard');
    });
  } catch (error) {
    global.logger.error('Reset password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/auth/forgot');
  }
});

module.exports = router;
