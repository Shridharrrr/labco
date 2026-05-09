const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const { getActivity } = require('../controllers/activity.controller');

// GET /api/boards/:boardId/activity
router.get('/', auth, boardAccess('viewer'), getActivity);

module.exports = router;
