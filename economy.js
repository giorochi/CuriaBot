const db = require('./db');

function getUser(id, name) {
  return new Promise((resolve) => {
    db.get("SELECT * FROM players WHERE id = ?", [id], (err, row) => {
      if (!row) {
        db.run("INSERT INTO players (id, name) VALUES (?, ?)", [id, name]);
        return resolve({ id, name, money: 100 });
      }
      resolve(row);
    });
  });
}

function addMoney(id, amount) {
  db.run("UPDATE players SET money = money + ? WHERE id = ?", [amount, id]);
}

module.exports = { getUser, addMoney };
