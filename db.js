const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'Fedele',
    title TEXT DEFAULT 'Nessuno',
    rank INTEGER DEFAULT 0,
    salary INTEGER DEFAULT 0,
    money INTEGER DEFAULT 100,
    properties TEXT DEFAULT '',
    duties TEXT DEFAULT ''
  )`);
});

module.exports = db;
