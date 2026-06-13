const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

function initDB() {
  const dbDir = path.join(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'edu_crm.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'manager',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      telegram TEXT,
      source TEXT,
      course_id INTEGER REFERENCES courses(id),
      manager_id INTEGER REFERENCES users(id),
      stage INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Yangi lead',
      lost_reason TEXT,
      notes TEXT,
      next_action TEXT,
      next_contact_date TEXT,
      last_contact_date TEXT,
      visit_date TEXT,
      payment_amount REAL,
      payment_method TEXT,
      payment_status TEXT,
      age INTEGER,
      inquiry_for TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      user_id INTEGER REFERENCES users(id),
      old_stage INTEGER,
      old_status TEXT,
      new_stage INTEGER,
      new_status TEXT,
      action_type TEXT,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      course_id INTEGER REFERENCES courses(id),
      amount REAL NOT NULL,
      method TEXT,
      status TEXT DEFAULT 'paid',
      payment_date TEXT,
      due_date TEXT,
      note TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
    
    // Passwords
    const adminHash = bcrypt.hashSync('admin123', 10);
    const mgr1Hash = bcrypt.hashSync('manager123', 10);
    const mgr2Hash = bcrypt.hashSync('manager123', 10);

    insertUser.run('admin', adminHash, 'Administrator', 'admin');
    insertUser.run('manager1', mgr1Hash, 'Aziza Karimova', 'manager');
    insertUser.run('manager2', mgr2Hash, 'Bobur Aliyev', 'manager');

    // Seed Courses
    const insertCourse = db.prepare('INSERT INTO courses (name, description, price) VALUES (?, ?, ?)');
    insertCourse.run("Koreya tili - Boshlang'ich (A1)", "A1 daraja", 500000);
    insertCourse.run("Koreya tili - O'rta (A2-B1)", "A2-B1 daraja", 700000);
    insertCourse.run("TOPIK tayyorlov", "TOPIK I va II", 800000);
    insertCourse.run("Koreya tili - Intensiv", "Tezlashtirilgan", 900000);
    insertCourse.run("Koreya madaniyati va til", "Madaniyat + til", 600000);

    // Seed Leads
    const insertLead = db.prepare(`
      INSERT INTO leads (full_name, phone, telegram, source, course_id, manager_id, stage, status, notes, next_action, next_contact_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `);
    
    const insertHistory = db.prepare(`
      INSERT INTO lead_history (lead_id, user_id, new_stage, new_status, action_type, comment)
      VALUES (?, ?, ?, ?, 'status_change', 'System seed')
    `);

    const sources = ['instagram', 'telegram', 'youtube', 'referral', 'website'];
    
    // Stage 1 leads
    let res = insertLead.run('Alijon Valiyev', '+998901234567', '@alijon', sources[0], 1, 2, 1, 'Yangi lead', '', 'Qongiroq qilish', new Date().toISOString().split('T')[0], '-1 days', '-1 days');
    insertHistory.run(res.lastInsertRowid, 1, 1, 'Yangi lead');

    res = insertLead.run('Madina Umarova', '+998901234568', '@madina', sources[1], 2, 3, 1, 'Kotarmadi', '', 'Qayta qongiroq', new Date(Date.now() - 86400000).toISOString().split('T')[0], '-2 days', '-1 days');
    insertHistory.run(res.lastInsertRowid, 2, 1, 'Kotarmadi');

    // Stage 2 leads
    res = insertLead.run('Sardor Qodirov', '+998901234569', '@sardor_q', sources[2], 3, 2, 2, 'Oylab koradi', 'Narxini qimmatroq dedi', 'Ertaga aloqaga chiqish', new Date().toISOString().split('T')[0], '-3 days', '-1 days');
    insertHistory.run(res.lastInsertRowid, 2, 2, 'Oylab koradi');

    res = insertLead.run('Zilola Rustamova', '+998901234570', '@ziko', sources[3], 1, 3, 2, 'Ota-onasi bilan maslahatlashadi', 'Dadasidan sorab aytadi', 'Juma kuni sorash', new Date(Date.now() + 86400000*2).toISOString().split('T')[0], '-4 days', '-2 days');
    insertHistory.run(res.lastInsertRowid, 3, 2, 'Ota-onasi bilan maslahatlashadi');

    // Stage 3 leads
    res = insertLead.run('Dilshod Tursunov', '+998901234571', '', sources[4], 4, 2, 3, 'Kelish sanasi belgilandi', '', 'Markazga kelishini kutish', new Date(Date.now() + 86400000).toISOString().split('T')[0], '-5 days', '-1 days');
    insertHistory.run(res.lastInsertRowid, 2, 3, 'Kelish sanasi belgilandi');

    // Stage 4 leads
    res = insertLead.run('Nigina Asrorova', '+998901234572', '@nigish', sources[0], 2, 3, 4, 'Sinov darsida qatnashdi', 'Dars yoqdi', 'Tolov qilishini eslatish', new Date().toISOString().split('T')[0], '-10 days', '-1 days');
    insertHistory.run(res.lastInsertRowid, 3, 4, 'Sinov darsida qatnashdi');

    // Stage 5 leads
    res = insertLead.run('Jasur Bekmurodov', '+998901234573', '@jasur_b', sources[1], 1, 2, 5, 'Vada berdi', 'Oylik tushsa tolaydi', 'Dushanba kuni eslatish', new Date(Date.now() + 86400000*3).toISOString().split('T')[0], '-15 days', '-2 days');
    insertHistory.run(res.lastInsertRowid, 2, 5, 'Vada berdi');

    // Stage 6 leads
    res = insertLead.run('Kamola Shokirova', '+998901234574', '', sources[2], 3, 3, 6, 'Darsga qatnayapti', '', '', '', '-20 days', '-5 days');
    insertHistory.run(res.lastInsertRowid, 3, 6, 'Darsga qatnayapti');

    console.log('Database seeded with initial data.');
  }

  return db;
}

if (require.main === module) {
  initDB();
}

module.exports = { initDB };
