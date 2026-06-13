const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'edu_crm.db');
const db = new Database(dbPath);

try {
  db.exec(`
    ALTER TABLE leads ADD COLUMN age INTEGER;
  `);
  console.log("Added column 'age' to leads table.");
} catch (e) {
  console.log("'age' column might already exist:", e.message);
}

try {
  db.exec(`
    ALTER TABLE leads ADD COLUMN inquiry_for TEXT;
  `);
  console.log("Added column 'inquiry_for' to leads table.");
} catch (e) {
  console.log("'inquiry_for' column might already exist:", e.message);
}

try {
  db.exec(`
    ALTER TABLE leads ADD COLUMN address TEXT;
  `);
  console.log("Added column 'address' to leads table.");
} catch (e) {
  console.log("'address' column might already exist:", e.message);
}

db.close();
console.log("Migration complete.");
