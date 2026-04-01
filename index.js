const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const http = require('http');
const econ = require('./economy');
const db = require('./db');
const cron = require('node-cron');
const {
  SALARY_ROLES,
  TAX_RATE,
  BANK_INTEREST,
  INDULGENCE_COST,
  PROPERTIES
} = require('./roleConfig');

console.log("AVVIO FILE");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

// PORTA FINTA RENDER
http.createServer((req, res) => res.end("OK")).listen(process.env.PORT || 10000);

// READY
client.once(Events.ClientReady, () => {
  console.log(`ONLINE ${client.user.tag}`);
});

// ================= CRON =================
async function dailyUpdate() {
  for (const guild of client.guilds.cache.values()) {
    const members = await guild.members.fetch();

    for (const member of members.values()) {
      const user = await econ.getUser(member.id, member.user.username);
      if (user.excommunicated) continue;

      let salary = 0;
      member.roles.cache.forEach(r => {
        if (SALARY_ROLES[r.name]) salary += SALARY_ROLES[r.name];
      });

      const tax = Math.floor(salary * TAX_RATE);
      const net = salary - tax;

      econ.addMoney(member.id, net);
      econ.log(member.id, "stipendio", net);

      const interest = Math.floor(user.bank * BANK_INTEREST);
      econ.addBank(member.id, interest);

      const props = await econ.getProperties(member.id);
      let income = 0;
      props.forEach(p => income += PROPERTIES[p.type].income);

      econ.addMoney(member.id, income);

      try {
        await member.send(`💰 +${net}\n🏦 +${interest}\n🏛️ +${income}`);
      } catch {}
    }
  }
}

cron.schedule('0 0 * * *', dailyUpdate);

// ================= SESSIONI =================
const sessions = new Map();

// ================= INTERACTION =================
client.on(Events.InteractionCreate, async i => {
  if (!i.isButton()) return;

  try {
    await i.deferReply({ ephemeral: true });

    const user = await econ.getUser(i.user.id, i.user.username);

    if (i.customId === "menu") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profilo').setLabel('Profilo').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('trasf').setLabel('Trasferisci').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('banca').setLabel('Banca').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('prop').setLabel('Proprietà').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ind').setLabel('Indulgenza').setStyle(ButtonStyle.Danger)
      );

      try {
  await i.user.send({ content: "📜 Menu", components: [row] });
  return i.editReply("✅ Menu inviato nei DM");
} catch {
  return i.editReply("❌ Non riesco a scriverti in DM. Attivali!");
}
    }

    if (i.customId === "profilo") {
      const props = await econ.getProperties(i.user.id);
      return i.editReply(`💰 ${user.money} | 🏦 ${user.bank} | 🏛️ ${props.length}`);
    }

    if (i.customId === "trasf") {
      sessions.set(i.user.id, { type: "transfer" });
      return i.editReply("Scrivi: @utente quantità");
    }

    if (i.customId === "banca") {
      sessions.set(i.user.id, { type: "bank" });
      return i.editReply("Scrivi: deposito/prelievo quantità");
    }

    if (i.customId === "prop") {
      let txt = "Proprietà:\n";
      for (const p in PROPERTIES) {
        txt += `${p} - ${PROPERTIES[p].price}\n`;
      }
      sessions.set(i.user.id, { type: "buy" });
      return i.editReply(txt);
    }

    if (i.customId === "ind") {
      if (user.money < INDULGENCE_COST) {
        return i.editReply("❌ Non hai soldi");
      }

      econ.addMoney(i.user.id, -INDULGENCE_COST);
      econ.log(i.user.id, "indulgenza", -INDULGENCE_COST);

      return i.editReply("✝️ Indulgenza acquistata");
    }

  } catch (err) {
    console.error("ERRORE INTERACTION:", err);
    try {
      return i.editReply("❌ Errore interno");
    } catch {}
  }
});

// ================= MESSAGE =================
client.on(Events.MessageCreate, async msg => {
  if (msg.author.bot) return;

  if (msg.content === "!menu") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu').setLabel('Apri Menu').setStyle(ButtonStyle.Primary)
    );
    return msg.reply({ content: "Apri 👇", components: [row] });
  }

  if (!sessions.has(msg.author.id)) return;

  const s = sessions.get(msg.author.id);
  const args = msg.content.split(" ");
  const user = await econ.getUser(msg.author.id, msg.author.username);

  // ===== TRANSFER =====
  if (s.type === "transfer") {
    const target = msg.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount)) {
      return msg.reply("Formato: @utente quantità");
    }

    if (user.money < amount) {
      return msg.reply("Non hai soldi");
    }

    econ.addMoney(user.id, -amount);
    econ.addMoney(target.id, amount);
    econ.log(user.id, "transfer", amount, target.id);

    sessions.delete(msg.author.id);
    return msg.reply("✅ Trasferimento completato");
  }

  // ===== BANCA =====
  if (s.type === "bank") {
    const amount = parseInt(args[1]);

    if (isNaN(amount)) {
      return msg.reply("Scrivi: deposito/prelievo quantità");
    }

    if (args[0] === "deposito") {
      econ.addMoney(user.id, -amount);
      econ.addBank(user.id, amount);
    }

    if (args[0] === "prelievo") {
      econ.addMoney(user.id, amount);
      econ.addBank(user.id, -amount);
    }

    sessions.delete(msg.author.id);
    return msg.reply("🏦 Operazione completata");
  }

  // ===== PROPRIETÀ =====
  if (s.type === "buy") {
    const type = args[0];
    const prop = PROPERTIES[type];

    if (!prop) return msg.reply("Proprietà non valida");

    if (user.money < prop.price) {
      return msg.reply("Non hai soldi");
    }

    econ.addMoney(user.id, -prop.price);
    econ.addProperty(user.id, type);

    sessions.delete(msg.author.id);
    return msg.reply(`🏛️ Comprato ${type}`);
  }
});

// LOGIN
console.log("TOKEN:", process.env.TOKEN ? "OK" : "MANCANTE");

client.login(process.env.TOKEN)
  .then(() => console.log("LOGIN OK"))
  .catch(err => console.error("ERRORE LOGIN:", err));
