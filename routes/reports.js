const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

// GET /api/reports/funnel
router.get('/funnel', verifyToken, (req, res) => {
  try {
    // Approximate funnel: Count leads currently in each stage, plus those who passed through it
    // For simplicity, we just return current leads in each stage and compute conversion assuming stage 1 -> 6
    const stages = db.prepare('SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY stage ASC').all();

    let total = 0;
    stages.forEach(s => total += s.count);

    let cumulative = total;
    const funnel = stages.map(s => {
      const current = cumulative;
      cumulative -= s.count; // subtract leads that STOPPED at this stage
      return {
        stage: s.stage,
        count: s.count,
        passed_through: current,
        conversion_rate: total > 0 ? Math.round((current / total) * 100) : 0
      };
    });

    res.json({ success: true, data: funnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/managers
router.get('/managers', verifyToken, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT u.id, u.full_name as manager_name,
             COUNT(l.id) as total_leads,
             SUM(CASE WHEN l.stage IN (5, 6) THEN 1 ELSE 0 END) as won_leads
      FROM users u
      LEFT JOIN leads l ON u.id = l.manager_id
      WHERE u.is_active = 1
      GROUP BY u.id
    `).all();

    data.forEach(d => {
      d.conversion_rate = d.total_leads > 0 ? Math.round((d.won_leads / d.total_leads) * 100) : 0;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/sources
router.get('/sources', verifyToken, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT source, COUNT(*) as count,
             SUM(CASE WHEN stage IN (5, 6) THEN 1 ELSE 0 END) as won_leads
      FROM leads
      GROUP BY source
    `).all();

    data.forEach(d => {
      d.conversion_rate = d.count > 0 ? Math.round((d.won_leads / d.count) * 100) : 0;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
