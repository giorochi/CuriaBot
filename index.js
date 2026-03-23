const { 
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, Events
} = require("discord.js");

const express = require("express");

const TOKEN = process.env.TOKEN;

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== WEB SERVER (RENDER KEEP ALIVE) =====
const app = express();
app.get("/", (req, res) => res.send("Bot attivo"));
app.listen(3000, () => console.log("Web server attivo"));

// ===== RUOLI + STIPENDI =====
const salari = {
  cittadino: 0,
  diacono: 5,
  sacerdote: 10,
  vescovo: 20,
  cardinale: 40,
  papa: 60
};

// ===== OTTIENI RUOLO UTENTE =====
function getRuoloUtente(member) {
  const ruoliUtente = member.roles.cache.map(r => r.name.toLowerCase());

  const ordine = ["papa", "cardinale", "vescovo", "sacerdote", "diacono"];

  for (const ruolo of ordine) {
    if (ruoliUtente.includes(ruolo)) {
      return ruolo;
    }
  }

  return "cittadino";
}

// ===== STIPENDIO =====
function calcolaStipendio(member) {
  const ruolo = getRuoloUtente(member);
  return salari[ruolo] || 0;
}

// ===== CONTROLLO ADMIN =====
function isAdmin(member) {
  return member.roles.cache.some(r =>
    ["papa", "segretario"].includes(r.name.toLowerCase())
  );
}

// ===== PANEL ADMIN =====
async function sendPanel(channel) {
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

  // ADMIN PANEL
  if (message.content === "!admin") {
    if (!isAdmin(message.member)) {
      return message.reply("Accesso negato");
    }
    return sendPanel(message.channel);
  }

  // USER PANEL
  if (message.content === "!me") {
    const ruolo = getRuoloUtente(message.member);
    const stipendio = calcolaStipendio(message.member);

    const embed = new EmbedBuilder()
      .setTitle("📊 Il tuo profilo")
      .addFields(
        { name: "Ruolo", value: ruolo },
        { name: "Stipendio", value: `${stipendio} ducati/giorno` }
      )
      .setColor(0x00ff99);

    return message.reply({ embeds: [embed] });
  }
});

// ===== INTERAZIONI BOTTONI =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (!isAdmin(interaction.member)) {
    return interaction.reply({ content: "Accesso negato", ephemeral: true });
  }

  if (interaction.customId === "bonus_view") {
    return interaction.reply({
      content: "Sistema bonus in sviluppo",
      ephemeral: true
    });
  }

  if (interaction.customId === "stats") {
    return interaction.reply({
      content: "Sistema attivo ✔",
      ephemeral: true
    });
  }
});

// ===== READY =====
client.once("ready", () => {
  console.log(`Bot online come ${client.user.tag}`);
});

client.login(TOKEN);
