const express = require('express');
const router = express.Router();
const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'edu_crm.db');

// GET /api/leads/stats
router.get('/stats', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    
    // Total
    const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    
    // By stage
    const byStageRows = db.prepare('SELECT stage, COUNT(*) as count FROM leads GROUP BY stage').all();
    const by_stage = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    byStageRows.forEach(row => {
      by_stage[row.stage] = row.count;
    });

    const todayDate = new Date().toISOString().split('T')[0];
    
    // Today's follow-ups
    const today_follow_ups = db.prepare('SELECT COUNT(*) as count FROM leads WHERE next_contact_date = ?').get(todayDate).count;
    
    // Overdue follow-ups
    const overdue_follow_ups = db.prepare("SELECT COUNT(*) as count FROM leads WHERE next_contact_date < ? AND next_contact_date != '' AND next_contact_date IS NOT NULL").get(todayDate).count;

    db.close();

    res.json({
      success: true,
      data: { total, by_stage, today_follow_ups, overdue_follow_ups }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/pipeline
router.get('/pipeline', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    const leads = db.prepare(`
      SELECT l.id, l.full_name, l.phone, l.source, l.stage, l.status, l.next_action, l.next_contact_date, c.name as course_name 
      FROM leads l 
      LEFT JOIN courses c ON l.course_id = c.id
      ORDER BY l.updated_at DESC
    `).all();
    db.close();

    const pipeline = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
    leads.forEach(lead => {
      if(pipeline[lead.stage]) {
        pipeline[lead.stage].push(lead);
      }
    });

    res.json({ success: true, data: pipeline });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/:id/history
router.get('/:id/history', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    const history = db.prepare(`
      SELECT h.*, u.full_name as user_name 
      FROM lead_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.lead_id = ?
      ORDER BY h.created_at DESC
    `).all(req.params.id);
    db.close();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/:id
router.get('/:id', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    const lead = db.prepare(`
      SELECT l.*, c.name as course_name, u.full_name as manager_name
      FROM leads l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN users u ON l.manager_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);
    db.close();

    if (!lead) return res.status(404).json({ success: false, error: 'Lead topilmadi' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads
router.get('/', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    let query = `
      SELECT l.*, c.name as course_name, u.full_name as manager_name
      FROM leads l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN users u ON l.manager_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.stage) {
      query += ' AND l.stage = ?';
      params.push(req.query.stage);
    }
    if (req.query.status) {
      query += ' AND l.status = ?';
      params.push(req.query.status);
    }
    if (req.query.manager_id) {
      query += ' AND l.manager_id = ?';
      params.push(req.query.manager_id);
    }
    if (req.query.course_id) {
      query += ' AND l.course_id = ?';
      params.push(req.query.course_id);
    }
    if (req.query.source) {
      query += ' AND l.source = ?';
      params.push(req.query.source);
    }
    if (req.query.search) {
      query += ' AND (l.full_name LIKE ? OR l.phone LIKE ?)';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    const todayDate = new Date().toISOString().split('T')[0];
    if (req.query.follow_up_today === 'true') {
      query += ' AND l.next_contact_date = ?';
      params.push(todayDate);
    }
    if (req.query.follow_up_overdue === 'true') {
      query += " AND l.next_contact_date < ? AND l.next_contact_date != '' AND l.next_contact_date IS NOT NULL";
      params.push(todayDate);
    }

    query += ' ORDER BY l.updated_at DESC';

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const leads = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM leads l WHERE 1=1';
    const countParams = [];
    if (req.query.stage) { countQuery += ' AND l.stage = ?'; countParams.push(req.query.stage); }
    if (req.query.status) { countQuery += ' AND l.status = ?'; countParams.push(req.query.status); }
    if (req.query.manager_id) { countQuery += ' AND l.manager_id = ?'; countParams.push(req.query.manager_id); }
    if (req.query.course_id) { countQuery += ' AND l.course_id = ?'; countParams.push(req.query.course_id); }
    if (req.query.source) { countQuery += ' AND l.source = ?'; countParams.push(req.query.source); }
    if (req.query.search) { countQuery += ' AND (l.full_name LIKE ? OR l.phone LIKE ?)'; countParams.push(`%${req.query.search}%`, `%${req.query.search}%`); }
    if (req.query.follow_up_today === 'true') { countQuery += ' AND l.next_contact_date = ?'; countParams.push(todayDate); }
    if (req.query.follow_up_overdue === 'true') { countQuery += " AND l.next_contact_date < ? AND l.next_contact_date != '' AND l.next_contact_date IS NOT NULL"; countParams.push(todayDate); }

    const total = db.prepare(countQuery).get(...countParams).count;

    db.close();

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads
router.post('/', verifyToken, (req, res) => {
  try {
    const { full_name, phone, telegram, source, course_id, manager_id, notes, next_action, next_contact_date, age, inquiry_for, address } = req.body;
    
    if (!full_name || !phone) {
      return res.status(400).json({ success: false, error: 'Ism va telefon raqam majburiy' });
    }

    const db = new Database(dbPath);
    const insert = db.prepare(`
      INSERT INTO leads (full_name, phone, telegram, source, course_id, manager_id, notes, next_action, next_contact_date, age, inquiry_for, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      full_name, 
      phone, 
      telegram || '', 
      source || 'other', 
      course_id || null, 
      manager_id || req.user.id, 
      notes || '', 
      next_action || '', 
      next_contact_date || '',
      age ? parseInt(age) : null,
      inquiry_for || '',
      address || ''
    );
    
    db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, new_stage, new_status, action_type, comment)
      VALUES (?, ?, 1, 'Yangi lead', 'status_change', 'Yaratildi')
    `).run(result.lastInsertRowid, req.user.id);

    db.close();
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/leads/:id
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { full_name, phone, telegram, source, course_id, manager_id, notes, next_action, next_contact_date, age, inquiry_for, address, stage, status } = req.body;
    
    const db = new Database(dbPath);
    
    // Get old lead details for history check
    const oldLead = db.prepare('SELECT stage, status FROM leads WHERE id = ?').get(req.params.id);
    if (!oldLead) {
      db.close();
      return res.status(404).json({ success: false, error: 'Lead topilmadi' });
    }

    const update = db.prepare(`
      UPDATE leads SET 
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        telegram = COALESCE(?, telegram),
        source = COALESCE(?, source),
        course_id = COALESCE(?, course_id),
        manager_id = COALESCE(?, manager_id),
        notes = COALESCE(?, notes),
        next_action = COALESCE(?, next_action),
        next_contact_date = COALESCE(?, next_contact_date),
        age = COALESCE(?, age),
        inquiry_for = COALESCE(?, inquiry_for),
        address = COALESCE(?, address),
        stage = COALESCE(?, stage),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    update.run(
      full_name, 
      phone, 
      telegram, 
      source, 
      course_id, 
      manager_id, 
      notes, 
      next_action, 
      next_contact_date, 
      age !== undefined ? (age ? parseInt(age) : null) : undefined, 
      inquiry_for, 
      address, 
      stage !== undefined ? parseInt(stage) : undefined,
      status,
      req.params.id
    );

    // Check if stage or status changed, if so write to history
    const hasStageChanged = stage !== undefined && parseInt(stage) !== oldLead.stage;
    const hasStatusChanged = status !== undefined && status !== oldLead.status;

    if (hasStageChanged || hasStatusChanged) {
      db.prepare(`
        INSERT INTO lead_history (lead_id, user_id, old_stage, old_status, new_stage, new_status, action_type, comment)
        VALUES (?, ?, ?, ?, ?, ?, 'status_change', ?)
      `).run(
        req.params.id, 
        req.user.id, 
        oldLead.stage, 
        oldLead.status, 
        stage !== undefined ? parseInt(stage) : oldLead.stage, 
        status || oldLead.status, 
        "Tahrirlash oynasidan o'zgartirildi"
      );
    }

    db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/leads/:id/stage
router.put('/:id/stage', verifyToken, (req, res) => {
  try {
    const { stage, status, comment } = req.body;
    if (!stage || !status) {
      return res.status(400).json({ success: false, error: 'Bosqich va holat majburiy' });
    }

    const db = new Database(dbPath);
    
    const oldLead = db.prepare('SELECT stage, status FROM leads WHERE id = ?').get(req.params.id);
    if (!oldLead) {
      db.close();
      return res.status(404).json({ success: false, error: 'Lead topilmadi' });
    }

    const update = db.prepare(`
      UPDATE leads SET 
        stage = ?, 
        status = ?, 
        updated_at = datetime('now'),
        last_contact_date = datetime('now')
      WHERE id = ?
    `);
    update.run(stage, status, req.params.id);

    db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, old_stage, old_status, new_stage, new_status, action_type, comment)
      VALUES (?, ?, ?, ?, ?, ?, 'status_change', ?)
    `).run(req.params.id, req.user.id, oldLead.stage, oldLead.status, stage, status, comment || '');

    db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/:id/action
router.post('/:id/action', verifyToken, (req, res) => {
  try {
    const { action_type, comment } = req.body;
    
    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, action_type, comment)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, req.user.id, action_type || 'note', comment || '');

    db.prepare("UPDATE leads SET updated_at = datetime('now'), last_contact_date = datetime('now') WHERE id = ?").run(req.params.id);

    db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const db = new Database(dbPath);
    db.prepare('DELETE FROM lead_history WHERE lead_id = ?').run(req.params.id);
    db.prepare('DELETE FROM payments WHERE lead_id = ?').run(req.params.id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/public (Public lead registration from landing page)
router.post('/public', (req, res) => {
  try {
    const { full_name, phone, age, course_id } = req.body;
    
    if (!full_name || !phone) {
      return res.status(400).json({ success: false, error: 'Ism va telefon raqam majburiy' });
    }

    const db = new Database(dbPath);
    
    // Find first active admin/manager to assign as manager
    const manager = db.prepare("SELECT id FROM users WHERE role = 'admin' OR role = 'manager' LIMIT 1").get();
    const managerId = manager ? manager.id : 1;

    const insert = db.prepare(`
      INSERT INTO leads (full_name, phone, source, course_id, manager_id, stage, status, age, inquiry_for, address, telegram, notes, next_action, next_contact_date)
      VALUES (?, ?, 'website', ?, ?, 1, 'Yangi lead', ?, 'O''zi uchun', '', '', '', '', '')
    `);

    const result = insert.run(
      full_name,
      phone,
      course_id ? parseInt(course_id) : null,
      managerId,
      age ? parseInt(age) : null
    );

    db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, new_stage, new_status, action_type, comment)
      VALUES (?, ?, 1, 'Yangi lead', 'status_change', 'Saytdan ro''yxatdan o''tdi')
    `).run(result.lastInsertRowid, managerId);

    db.close();
    res.json({ success: true, message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
