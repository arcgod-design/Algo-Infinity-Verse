// backend/controllers/thinkingReplayController.js
const ThinkingReplayService = require('../services/thinkingReplayService');

// Helper functions (replace with actual DB queries)
async function getSnapshots(_userId, _problemId) {
  // Return sample data for now
  return [
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      code: 'function solve(arr) { return arr; }',
      status: 'submitted',
      executionTime: 1500,
      errors: null
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      code: 'function solve(arr) { return arr.sort(); }',
      status: 'submitted',
      executionTime: 500,
      errors: null
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      code: 'function solve(arr) { return arr.sort((a,b) => a-b); }',
      status: 'accepted',
      executionTime: 100,
      errors: null
    }
  ];
}

async function getEditorEvents(_userId, _problemId) {
  return [
    { type: 'typing', timestamp: new Date(Date.now() - 300000) },
    { type: 'typing', timestamp: new Date(Date.now() - 280000) },
    { type: 'run', timestamp: new Date(Date.now() - 250000) }
  ];
}

async function getSubmissions(_userId, _problemId) {
  return [
    { status: 'failed', timestamp: new Date(Date.now() - 200000) },
    { status: 'accepted', timestamp: new Date(Date.now() - 60000) }
  ];
}

// 🔥 ISSUE #2281: Replay generation logic moved here
exports.getReplay = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user?.id || 'anonymous';

    const snapshots = await getSnapshots(userId, problemId);
    const events = await getEditorEvents(userId, problemId);
    const submissions = await getSubmissions(userId, problemId);

    if (!snapshots || snapshots.length < 2) {
      return res.status(404).json({
        error: 'Not enough data to generate replay',
        message: 'Make more attempts to generate replay'
      });
    }

    const service = new ThinkingReplayService();
    const replay = await service.generateReplay(snapshots, events, submissions);

    res.json({
      success: true,
      data: replay
    });
  } catch (error) {
    console.error('Replay error:', error);
    res.status(500).json({ error: 'Failed to generate replay' });
  }
};