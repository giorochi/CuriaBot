const { 
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, Events
} = require("discord.js");

const express = require("express");
const fs = require("fs");

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

// ===== WEB SERVER (RENDER) =====
const app = express();
app.get("/", (req, res) => res.send("Bot attivo"));
app.listen(3000, () => console.log("Web server attivo"));

// ===== DATABASE =====
let data = fs.existsSync("./data.json")
  ? JSON.parse(fs.readFileSync("./data.json"))
  : {
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

// ===== PERMESSI =====
function isAdmin(member) {
  return member.roles.cache.some(r =>
    r.name === "papa" || r.name === "segretario"
  );
}

// ===== PANEL =====
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

// ===== COMANDO ADMIN =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!admin") {
    if (!isAdmin(message.member)) {
      return message.reply("Accesso negato");
    }

    return sendPanel(message.channel);
  }
});

// ===== INTERAZIONI =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const member = interaction.member;

  if (!isAdmin(member)) {
    return interaction.reply({ content: "Accesso negato", ephemeral: true });
  }

  // ===== BONUS VIEW =====
  if (interaction.customId === "bonus_view") {
    const embed = new EmbedBuilder()
      .setTitle("✨ Bonus Ruoli")
      .setDescription(
        Object.entries(data.bonusRuoli)
          .map(([ruolo, bonus]) => `**${ruolo}** → +${bonus} ducati`)
          .join("\n")
      )
      .setColor(0x00aaff);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bonus_add")
        .setLabel("Aumenta Bonus")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("bonus_remove")
        .setLabel("Riduci Bonus")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("back")
        .setLabel("Indietro")
        .setStyle(ButtonStyle.Secondary)
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

  // ===== BONUS MODIFICA =====
  if (interaction.customId === "bonus_add") {
    Object.keys(data.bonusRuoli).forEach(r => {
      data.bonusRuoli[r] += 5;
    });

    saveData();

    return interaction.reply({
      content: "Bonus aumentati ✔",
      ephemeral: true
    });
  }

  if (interaction.customId === "bonus_remove") {
    Object.keys(data.bonusRuoli).forEach(r => {
      data.bonusRuoli[r] = Math.max(0, data.bonusRuoli[r] - 5);
    });

    saveData();

    return interaction.reply({
      content: "Bonus ridotti ✔",
      ephemeral: true
    });
  }

  // ===== BACK =====
  if (interaction.customId === "back") {
    return interaction.reply({
      content: "Chiudi e riapri !admin",
      ephemeral: true
    });
  }
});

// ===== READY =====
client.once("clientReady", () => {
  console.log(`Bot online come ${client.user.tag}`);
});

client.login(TOKEN);
