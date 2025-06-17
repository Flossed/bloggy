const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Local strategy for login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return done(null, false, { message: 'No user found with that email.' });
      }

      // Check if user is active
      if (!user.isActive) {
        return done(null, false, { message: 'Your account has been deactivated. Please contact an administrator.' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Update last login
      await user.updateLastLogin();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Local strategy for signup
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { username: req.body.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return done(null, false, { message: 'That email is already taken.' });
        } else {
          return done(null, false, { message: 'That username is already taken.' });
        }
      }

      // Create new user
      const newUser = new User({
        username: req.body.username,
        email: email.toLowerCase(),
        password: password,
        blogSpace: {
          title: `${req.body.username}'s Blog`,
          description: `Welcome to ${req.body.username}'s blog space`
        }
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));
};
