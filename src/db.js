const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'portal.db');
if (!require('fs').existsSync(path.dirname(DB_PATH))) {
  require('fs').mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

module.exports = db;
