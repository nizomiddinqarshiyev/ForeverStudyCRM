const express = require('express');
const router = express.Router();
const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'edu_crm.db');

// GET /api/payments
router.get('/', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    let query = `
      SELECT p.*, l.full_name as lead_name, c.name as course_name, u.full_name as created_by_name
      FROM payments p
      LEFT JOIN leads l ON p.lead_id = l.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.lead_id) { query += ' AND p.lead_id = ?'; params.push(req.query.lead_id); }
    if (req.query.status) { query += ' AND p.status = ?'; params.push(req.query.status); }
    
    query += ' ORDER BY p.created_at DESC';

    const payments = db.prepare(query).all(...params);
    db.close();

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/payments
router.post('/', verifyToken, (req, res) => {
  try {
    const { lead_id, course_id, amount, method, status, payment_date, due_date, note } = req.body;
    if (!lead_id || !amount) return res.status(400).json({ success: false, error: 'Lead va summa majburiy' });

    const db = new Database(dbPath);
    
    db.prepare(`
      INSERT INTO payments (lead_id, course_id, amount, method, status, payment_date, due_date, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, course_id || null, amount, method || 'cash', status || 'paid', payment_date || new Date().toISOString().split('T')[0], due_date || null, note || '', req.user.id);

    db.prepare('UPDATE leads SET payment_amount = ?, payment_method = ?, payment_status = ? WHERE id = ?')
      .run(amount, method || 'cash', status || 'paid', lead_id);

    db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, action_type, comment)
      VALUES (?, ?, 'payment', ?)
    `).run(lead_id, req.user.id, `To'lov qabul qilindi: ${amount} so'm`);

    db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
