const db = require('./db');

function getUser(id) {
  return new Promise((resolve) => {
    db.get("SELECT * FROM players WHERE id = ?", [id], (err, row) => {
      if (!row) {
        db.run("INSERT INTO players (id, name) VALUES (?, ?)", [id, "User"]);
        return resolve(null);
      }
      resolve(row);
    });
  });
}

function updateMoney(id, amount) {
  db.run("UPDATE players SET money = money + ? WHERE id = ?", [amount, id]);
}

function setMoney(id, amount) {
  db.run("UPDATE players SET money = ? WHERE id = ?", [amount, id]);
}

module.exports = { getUser, updateMoney, setMoney };
