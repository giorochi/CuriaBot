const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

// ===== DATABASE =====
let data = fs.existsSync("./data.json")
  ? JSON.parse(fs.readFileSync("./data.json"))
  : {
      users: {},
      basilica: { funds: 0, goal: 100000 },
      bonusRoles: {}
    };

function saveData() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ===== STIPENDI =====
const stipendi = {
  cittadino: 20,
  diacono: 40,
  sacerdote: 80,
  vescovo: 150,
  cardinale: 300,
  papa: 500
};

// ===== FUNZIONE RUOLO DISCORD → BOT =====
function getRuoloDiscord(member) {
  const nomi = ["papa","cardinale","vescovo","sacerdote","diacono","cittadino"];
  for (let nome of nomi) {
    if (member.roles.cache.some(r => r.name === nome)) return nome;
  }
  return "cittadino";
}

// ===== PERMESSI =====
function isStaff(member) {
  return member.roles.cache.some(r =>
    r.name === "papa" || r.name === "segretario"
  );
}

// ===== UTENTE =====
function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      balance: 100,
      peccati: 0,
      bonus: []
    };
  }
  return data.users[id];
}

// ===== BONUS =====
function calcolaBonus(user) {
  let tot = 0;
  user.bonus.forEach(b => {
    if (data.bonusRoles[b]) tot += data.bonusRoles[b];
  });
  return tot;
}

// ===== CICLO GIORNALIERO =====
setInterval(() => {
  for (let id in data.users) {
    let u = data.users[id];

    let ruolo = "cittadino"; // fallback
    let stipendio = stipendi[ruolo] + calcolaBonus(u);

    u.balance += stipendio;

    let tax = Math.floor(u.balance * 0.1);
    u.balance -= tax;
    data.basilica.funds += tax;

    if (Math.random() < 0.3) {
      u.peccati += Math.floor(Math.random() * 3) + 1;
    }
  }

  saveData();
}, 24 * 60 * 60 * 1000);

// ===== BOT =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const member = message.member;
  const user = getUser(message.author.id);
  const args = message.content.split(" ");
  const cmd = args[0].toLowerCase();

  const ruolo = getRuoloDiscord(member);

  // ===== PANNELLO PRIVATO =====
  if (cmd === "!panel") {
    try {
      await message.author.send(
`📊 **STATO PERSONALE**

💰 Ducati: ${user.balance}
⛪ Ruolo: ${ruolo}
😈 Peccati: ${user.peccati}
✨ Bonus: ${user.bonus.join(", ") || "nessuno"}

🏗️ Basilica: ${data.basilica.funds}/${data.basilica.goal}`
      );

      return message.reply("📩 Ti ho scritto in privato");
    } catch {
      return message.reply("Non posso scriverti in DM");
    }
  }

  // ===== GUADAGNA =====
  if (cmd === "!guadagna") {
    const amount = Math.floor(Math.random() * 50) + 20;
    user.balance += amount;
    saveData();
    return message.reply("Hai guadagnato ducati");
  }

  // ===== INDULGENZA =====
  if (cmd === "!indulgenza") {
    const costo = 50;

    if (user.balance < costo)
      return message.reply("Non hai abbastanza ducati");

    user.balance -= costo;
    user.peccati = Math.max(0, user.peccati - 3);
    data.basilica.funds += costo;

    saveData();

    return message.reply("✝️ Indulgenza concessa");
  }

  // ===== DONA =====
  if (cmd === "!dona") {
    const amount = parseInt(args[1]);
    if (!amount) return;

    if (user.balance < amount)
      return message.reply("Non hai abbastanza ducati");

    user.balance -= amount;
    data.basilica.funds += amount;

    saveData();

    return message.reply("⛪ Donazione effettuata");
  }

  // ===== PROMOZIONE =====
  if (cmd === "!promuovi") {
    if (!isStaff(member))
      return message.reply("Solo Papa o Segretario");

    const target = message.mentions.members.first();
    if (!target) return;

    const ordine = ["cittadino","diacono","sacerdote","vescovo","cardinale","papa"];

    let attuale = getRuoloDiscord(target);
    let prossimo = ordine[ordine.indexOf(attuale) + 1];

    if (!prossimo) return message.reply("Già al massimo");

    const ruoloDiscord = message.guild.roles.cache.find(r => r.name === prossimo);

    await target.roles.add(ruoloDiscord);

    return message.reply(`Promosso a ${prossimo}`);
  }

  // ===== BONUS =====
  if (cmd === "!creabonus") {
    if (!isStaff(member)) return;

    const nome = args[1];
    const valore = parseInt(args[2]);

    data.bonusRoles[nome] = valore;
    saveData();

    return message.reply("Bonus creato");
  }

  if (cmd === "!assegnabonus") {
    if (!isStaff(member)) return;

    const target = message.mentions.users.first();
    const nome = args[2];

    const u = getUser(target.id);
    u.bonus.push(nome);

    saveData();

    return message.reply("Bonus assegnato");
  }
});

// ===== AVVIO =====
client.once("clientReady", () => {
  console.log(`Bot online come ${client.user.tag}`);
});

client.login(TOKEN);
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot attivo");
});

app.listen(3000, () => {
  console.log("Server web attivo sulla porta 3000");
});
