const { 
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, Events
} = require("discord.js");

const express = require("express");
const fs = require("fs");

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== SERVER WEB (PER RENDER) =====
const app = express();
app.get("/", (req, res) => res.send("Bot attivo"));
app.listen(3000, () => console.log("Web server attivo"));

// ===== DATABASE =====
let data = fs.existsSync("./data.json")
  ? JSON.parse(fs.readFileSync("./data.json"))
  : {
      users: {},
      bonusRuoli: {
        cittadino: 0,
        diacono: 5,
        sacerdote: 10,
        vescovo: 20,
        cardinale: 40,
        papa: 60
      }
    };

function saveData() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ===== STIPENDI BASE =====
const stipendiBase = {
  cittadino: 5,
  diacono: 10,
  sacerdote: 20,
  vescovo: 40,
  cardinale: 80,
  papa: 120
};

// ===== RUOLO DISCORD =====
function getRuolo(member) {
  const order = ["papa","cardinale","vescovo","sacerdote","diacono","cittadino"];
  for (let r of order) {
    if (member.roles.cache.some(role => role.name === r)) return r;
  }
  return "cittadino";
}

// ===== PERMESSI ADMIN =====
function isAdmin(member) {
  return member.roles.cache.some(r =>
    r.name === "papa" || r.name === "segretario"
  );
}

// ===== PANEL ADMIN =====
async function sendAdminPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("⚙️ Pannello Amministrativo")
    .setDescription("Gestione Curia")
    .setColor(0x2b2d31);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("bonus_view")
      .setLabel("Bonus Ruoli")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("stats")
      .setLabel("Statistiche")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ===== COMANDI =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!admin") {
    if (!isAdmin(message.member))
      return message.reply("Accesso negato");

    return sendAdminPanel(message.channel);
  }
});

// ===== INTERAZIONI BOTTONI =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const member = interaction.member;

  if (!isAdmin(member))
    return interaction.reply({ content: "Accesso negato", ephemeral: true });

  // ===== VISTA BONUS =====
  if (interaction.customId === "bonus_view") {
    const embed = new EmbedBuilder()
      .setTitle("✨ Bonus Ruoli")
      .setDescription(
        Object.entries(data.bonusRuoli)
          .map(([ruolo, bonus]) => `${ruolo}: +${bonus} ducati`)
          .join("\n")
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bonus_plus")
        .setLabel("Aumenta Bonus")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("bonus_minus")
        .setLabel("Diminuisci Bonus")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // ===== STATISTICHE =====
  if (interaction.customId === "stats") {
    return interaction.reply({
      content: "Sistema attivo ✔",
      ephemeral: true
    });
  }

  // ===== MODIFICA BONUS =====
  if (interaction.customId === "bonus_plus" || interaction.customId === "bonus_minus") {
    const factor = interaction.customId === "bonus_plus" ? 5 : -5;

    const ruoli = Object.keys(data.bonusRuoli);

    let msg = "Ruoli aggiornati:\n";

    ruoli.forEach(r => {
      data.bonusRuoli[r] += factor;
      if (data.bonusRuoli[r] < 0) data.bonusRuoli[r] = 0;
      msg += `${r}: ${data.bonusRuoli[r]}\n`;
    });

    saveData();

    return interaction.reply({ content: msg, ephemeral: true });
  }
});

// ===== STIPENDIO GIORNALIERO =====
setInterval(async () => {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  await guild.members.fetch();

  guild.members.cache.forEach(member => {
    if (member.user.bot) return;

    const ruolo = getRuolo(member);

    const base = stipendiBase[ruolo] || 5;
    const bonus = data.bonusRuoli[ruolo] || 0;

    const totale = base + bonus;

    console.log(`${member.user.username} riceve ${totale} ducati`);
  });

  saveData();
}, 24 * 60 * 60 * 1000);

// ===== READY =====
client.once("clientReady", () => {
  console.log(`Bot online come ${client.user.tag}`);
});

client.login(TOKEN);
