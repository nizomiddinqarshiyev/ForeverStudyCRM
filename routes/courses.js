const express = require('express');
const router = express.Router();
const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'edu_crm.db');

// GET /api/courses
router.get('/', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    const courses = db.prepare(`
      SELECT c.*, COUNT(l.id) as lead_count 
      FROM courses c
      LEFT JOIN leads l ON c.id = l.course_id AND l.stage IN (1,2,3,4,5,6)
      WHERE c.is_active = 1
      GROUP BY c.id
    `).all();
    db.close();

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/courses
router.post('/', verifyToken, (req, res) => {
  try {
    const { name, description, price } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Kurs nomi majburiy' });

    const db = new Database(dbPath);
    const result = db.prepare('INSERT INTO courses (name, description, price) VALUES (?, ?, ?)').run(name, description || '', price || 0);
    db.close();

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/courses/:id
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { name, description, price } = req.body;
    const db = new Database(dbPath);
    db.prepare('UPDATE courses SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price) WHERE id = ?').run(name, description, price, req.params.id);
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    db.prepare('UPDATE courses SET is_active = 0 WHERE id = ?').run(req.params.id);
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/courses/public (Public active courses list for landing page)
router.get('/public', (req, res) => {
  try {
    const db = new Database(dbPath);
    const courses = db.prepare('SELECT id, name, price FROM courses WHERE is_active = 1').all();
    db.close();

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
