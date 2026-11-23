const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');
const { sendVerificationEmail } = require('../services/email.service');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPlaceholderSmtp = () => {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  return (
    !host ||
    host.includes('example.com') ||
    user === 'your_smtp_user' ||
    user === 'your_brevo_login_email' ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'your_smtp_password' ||
    process.env.SMTP_PASS === 'your_brevo_smtp_key'
  );
};

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

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Name, valid email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // In local dev with placeholder SMTP, auto-verify to prevent developer lockout
    const autoVerify = process.env.NODE_ENV !== 'production' && isPlaceholderSmtp();

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
      isEmailVerified: autoVerify,
    });

    // Generate email verification token (valid for 24 hours) with strict type claim
    const verificationToken = jwt.sign(
      { userId: user._id.toString(), type: 'email-verification' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });

    if (autoVerify) {
      console.log(`\n======================================================`);
      console.log(`[DEV MODE] Auto-verified email for ${cleanEmail} (placeholder SMTP detected).`);
      console.log(`Direct verification link: ${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`);
      console.log(`======================================================\n`);
      return res.status(201).json({
        message: 'Registration successful! You can now log in immediately.',
        autoVerified: true,
      });
    }

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
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified) {
      // In development with placeholder SMTP, auto-verify on first login attempt
      if (process.env.NODE_ENV !== 'production' && isPlaceholderSmtp()) {
        user.isEmailVerified = true;
        await user.save();
      } else {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

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
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Verify against Redis
    const stored = await redis.get(`refresh:${decoded.userId}`);
    if (!stored || stored !== token) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'User not found' });
    }

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
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
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
    if (typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ message: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Ensure it is specifically a verification token
    if (decoded.type && decoded.type !== 'email-verification') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified. You can log in.' });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.json({ message: 'Email successfully verified' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Do not reveal email existence to prevent user enumeration
      return res.json({ message: 'If this email is registered and unverified, a verification link has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please log in.' });
    }

    const verificationToken = jwt.sign(
      { userId: user._id.toString(), type: 'email-verification' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '24h' }
    );

    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });

    if (process.env.NODE_ENV !== 'production' && isPlaceholderSmtp()) {
      console.log(`[DEV MODE] Resend verification link: ${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`);
    }

    return res.json({ message: 'If this email is registered and unverified, a verification link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (typeof credential !== 'string' || !credential) {
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
    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId,
        avatar: avatar || '',
        isEmailVerified: true,
      });
    }

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
