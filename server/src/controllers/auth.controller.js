const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');
const { sendVerificationEmail } = require('../services/email.service');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signAccess = (userId, email) =>
  jwt.sign({ userId, email }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefresh = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, passwordHash: password, isEmailVerified: false });

    // Generate email verification token (valid for 24 hours)
    const verificationToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Wrong credentials' });

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Wrong credentials' });

    const accessToken = signAccess(user._id.toString(), user.email);
    const refreshToken = signRefresh(user._id.toString());

    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: { _id: user._id, userId: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Verify against Redis
    const stored = await redis.get(`refresh:${decoded.userId}`);
    if (!stored || stored !== token) {
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccess = signAccess(user._id.toString(), user.email);
    const newRefresh = signRefresh(user._id.toString());

    await redis.set(`refresh:${user._id}`, newRefresh, 'EX', 7 * 24 * 60 * 60);
    user.refreshToken = newRefresh;
    await user.save();

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: newAccess });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await redis.del(`refresh:${decoded.userId}`);
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      } catch {
        // Token already invalid — still clear cookie
      }
    }
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userObj = user.toObject();
    userObj.userId = user._id;
    return res.json(userObj);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.json({ message: 'Email successfully verified' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google credential' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // Link google account if not linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google emails are already verified
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        isEmailVerified: true, // Google emails are verified
      });
    }

    // Login logic
    const accessToken = signAccess(user._id.toString(), user.email);
    const refreshToken = signRefresh(user._id.toString());

    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: { _id: user._id, userId: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
};
