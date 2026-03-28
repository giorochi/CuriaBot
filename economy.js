const db = require('./db');

function getUser(id, name) {
  return new Promise(resolve => {
    db.get("SELECT * FROM players WHERE id = ?", [id], (err, row) => {
      if (!row) {
        db.run("INSERT INTO players (id, name) VALUES (?, ?)", [id, name]);
        return resolve({ id, name, money: 100, bank: 0, excommunicated: 0 });
      }
      resolve(row);
    });
  });
}

function addMoney(id, amount) {
  db.run("UPDATE players SET money = money + ? WHERE id = ?", [amount, id]);
}

function addBank(id, amount) {
  db.run("UPDATE players SET bank = bank + ? WHERE id = ?", [amount, id]);
}

function setExcommunication(id, value) {
  db.run("UPDATE players SET excommunicated = ? WHERE id = ?", [value, id]);
}

function addProperty(owner, type) {
  db.run("INSERT INTO properties (owner, type) VALUES (?, ?)", [owner, type]);
}

function getProperties(owner) {
  return new Promise(resolve => {
    db.all("SELECT * FROM properties WHERE owner = ?", [owner], (e, rows) => resolve(rows));
  });
}

function log(user, type, amount, target = null) {
  db.run(
    "INSERT INTO transactions (user, type, amount, target, date) VALUES (?, ?, ?, ?, ?)",
    [user, type, amount, target, new Date().toISOString()]
  );
}

module.exports = {
  getUser,
  addMoney,
  addBank,
  setExcommunication,
  addProperty,
  getProperties,
  log
};
