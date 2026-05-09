const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', auth, getMe);

module.exports = router;
