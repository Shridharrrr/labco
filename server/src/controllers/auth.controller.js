const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');

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

    const user = await User.create({ name, email, passwordHash: password });

    const accessToken = signAccess(user._id.toString(), user.email);
    const refreshToken = signRefresh(user._id.toString());

    // Store refresh token in Redis (7 day TTL) and DB
    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
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
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

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
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
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
    return res.json(user);
  } catch (err) {
    next(err);
  }
};
