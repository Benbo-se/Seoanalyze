const express = require('express');
const router = express.Router();
const { ulid } = require('ulid');

// In-memory storage for MVP (move to database later)
const issueStatuses = new Map();
const issueFeedback = new Map();
const issueTelemetry = new Map();

/**
 * PATCH /v1/issues/:id - Update issue status
 * Body: { status: 'open|in_progress|fixed|ignored', notes?: string }
 */
router.patch('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['open', 'in_progress', 'fixed', 'ignored'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Store status update
    const update = {
      id,
      status,
      notes: notes || '',
      updatedAt: new Date().toISOString(),
      updatedBy: req.ip || 'anonymous'
    };

    issueStatuses.set(id, update);

    // Track telemetry
    const telemetryKey = `${id}_status_changes`;
    const existing = issueTelemetry.get(telemetryKey) || [];
    existing.push({
      action: 'status_change',
      from_status: existing.length > 0 ? existing[existing.length - 1].to_status : 'open',
      to_status: status,
      timestamp: new Date().toISOString(),
      user_ip: req.ip
    });
    issueTelemetry.set(telemetryKey, existing);

    console.log(`[FAS4] Issue ${id} status updated: ${status} from ${req.ip}`);

    res.json({
      success: true,
      issue: update,
      telemetry: {
        total_status_changes: existing.length,
        previous_status: existing.length > 1 ? existing[existing.length - 2].to_status : 'open'
      }
    });

  } catch (error) {
    console.error('Issue status update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /v1/issues/:id - Get issue details and status
 */
router.get('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = issueStatuses.get(id);
    const feedback = issueFeedback.get(id) || [];
    const telemetry = issueTelemetry.get(`${id}_status_changes`) || [];
    const copyTelemetry = issueTelemetry.get(`${id}_copies`) || [];

    res.json({
      id,
      status: status || { status: 'open', updatedAt: new Date().toISOString() },
      feedback: feedback,
      stats: {
        status_changes: telemetry.length,
        copies: copyTelemetry.length,
        feedback_count: feedback.length
      },
      timeline: telemetry.slice(-10) // Last 10 events
    });

  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /v1/issues/:id/feedback - Submit feedback on issue
 * Body: { type: 'thumbs_up|thumbs_down', message?: string }
 */
router.post('/issues/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message } = req.body;

    // Validate feedback type
    const validTypes = ['thumbs_up', 'thumbs_down'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid feedback type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Store feedback
    const feedback = {
      id: ulid(),
      issue_id: id,
      type,
      message: message || '',
      timestamp: new Date().toISOString(),
      user_ip: req.ip || 'anonymous'
    };

    const existingFeedback = issueFeedback.get(id) || [];
    existingFeedback.push(feedback);
    issueFeedback.set(id, existingFeedback);

    // Track telemetry
    const telemetryKey = `${id}_feedback`;
    const existing = issueTelemetry.get(telemetryKey) || [];
    existing.push({
      action: 'feedback_submitted',
      feedback_type: type,
      timestamp: new Date().toISOString(),
      user_ip: req.ip
    });
    issueTelemetry.set(telemetryKey, existing);

    console.log(`[FAS4] Issue ${id} feedback: ${type} from ${req.ip}`);

    res.json({
      success: true,
      feedback,
      stats: {
        total_feedback: existingFeedback.length,
        thumbs_up: existingFeedback.filter(f => f.type === 'thumbs_up').length,
        thumbs_down: existingFeedback.filter(f => f.type === 'thumbs_down').length
      }
    });

  } catch (error) {
    console.error('Issue feedback error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /v1/issues/:id/telemetry - Track user actions (copy, click, etc)
 * Body: { action: 'copy|guide_click|panel_open', data?: object }
 */
router.post('/issues/:id/telemetry', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data } = req.body;

    const validActions = ['copy', 'guide_click', 'panel_open', 'panel_close'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`
      });
    }

    // Store telemetry event
    const telemetryKey = `${id}_${action}s`;
    const existing = issueTelemetry.get(telemetryKey) || [];
    existing.push({
      action,
      data: data || {},
      timestamp: new Date().toISOString(),
      user_ip: req.ip
    });
    issueTelemetry.set(telemetryKey, existing);

    // Also track in general telemetry
    const allKey = `${id}_all_actions`;
    const allActions = issueTelemetry.get(allKey) || [];
    allActions.push({
      action,
      data: data || {},
      timestamp: new Date().toISOString(),
      user_ip: req.ip
    });
    issueTelemetry.set(allKey, allActions);

    res.json({
      success: true,
      action,
      count: existing.length
    });

  } catch (error) {
    console.error('Issue telemetry error:', error);
    res.status(500).json({
      error: 'Internal server error', 
      message: error.message
    });
  }
});

/**
 * GET /v1/issues/stats - Get aggregated stats for all issues
 */
router.get('/issues/stats', async (req, res) => {
  try {
    const stats = {
      total_issues: issueStatuses.size,
      status_breakdown: {
        open: 0,
        in_progress: 0,
        fixed: 0,
        ignored: 0
      },
      total_feedback: 0,
      feedback_sentiment: {
        positive: 0,
        negative: 0
      },
      total_actions: 0,
      popular_actions: {}
    };

    // Count statuses
    for (const [id, status] of issueStatuses) {
      stats.status_breakdown[status.status]++;
    }

    // Count feedback
    for (const [id, feedback] of issueFeedback) {
      stats.total_feedback += feedback.length;
      feedback.forEach(f => {
        if (f.type === 'thumbs_up') stats.feedback_sentiment.positive++;
        if (f.type === 'thumbs_down') stats.feedback_sentiment.negative++;
      });
    }

    // Count actions
    for (const [key, actions] of issueTelemetry) {
      if (key.includes('_all_actions')) {
        stats.total_actions += actions.length;
        actions.forEach(a => {
          stats.popular_actions[a.action] = (stats.popular_actions[a.action] || 0) + 1;
        });
      }
    }

    res.json(stats);

  } catch (error) {
    console.error('Issue stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;