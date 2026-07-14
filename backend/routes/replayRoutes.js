// backend/routes/thinkingReplayRoutes.js
const express = require('express');
const router = express.Router();
const thinkingReplayController = require('../controllers/thinkingReplayController');

// 🆕 Get replay for a problem - Now using controller
router.get('/replay/:problemId', thinkingReplayController.getReplay);

// Save snapshot (still inline - can be extracted later)
router.post('/snapshot', async (req, res) => {
  try {
    const { problemId, code, status, executionTime, errors } = req.body;
    const userId = req.user?.id || 'anonymous';
    // Save snapshot to database
    console.log('Saving snapshot:', { userId, problemId, code, status, executionTime, errors });
    res.json({ success: true, message: 'Snapshot saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Log editor event (still inline)
router.post('/event', async (req, res) => {
  try {
    const { problemId, type } = req.body;
    const userId = req.user?.id || 'anonymous';
    console.log('Saving event:', { userId, problemId, type });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log event' });
  }
});

module.exports = router;