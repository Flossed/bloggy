const express = require('express');
const router = express.Router();
const passport = require('passport');

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

module.exports = router;
