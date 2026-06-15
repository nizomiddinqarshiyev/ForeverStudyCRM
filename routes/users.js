const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/users
router.get('/', verifyToken, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.role, u.is_active,
             COUNT(l.id) as total_leads,
             SUM(CASE WHEN l.stage IN (5, 6) THEN 1 ELSE 0 END) as won_leads
      FROM users u
      LEFT JOIN leads l ON u.id = l.manager_id
      WHERE u.is_active = 1
      GROUP BY u.id
    `).all();

    users.forEach(u => {
      u.conversion_rate = u.total_leads > 0 ? Math.round((u.won_leads / u.total_leads) * 100) : 0;
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users
router.post('/', verifyToken, requireAdmin, (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'Barcha maydonlarni toldiring' });
    }

    const hash = bcrypt.hashSync(password, 10);

    try {
      const result = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(username, hash, full_name, role || 'manager');
      res.json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, error: 'Bu login band' });
      }
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const { username, full_name, password, role } = req.body;
    
    let updateQuery = 'UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), username = COALESCE(?, username)';
    const params = [
      full_name === undefined ? null : full_name,
      role === undefined ? null : role,
      username === undefined ? null : username
    ];

    if (password) {
      updateQuery += ', password_hash = ?';
      params.push(bcrypt.hashSync(password, 10));
    }
    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    try {
      db.prepare(updateQuery).run(...params);
      res.json({ success: true });
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, error: 'Bu login band' });
      }
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
