const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  googleAuth
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/google', googleAuth);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', auth, getMe);

module.exports = router;
