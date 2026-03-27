const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const db = require('./db');
const econ = require('./economy');
const cron = require('node-cron');
const { SALARY_ROLES, TAX_RATE } = require('./roleConfig');

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

// =========================
// BOT ONLINE
// =========================
client.once(Events.ClientReady, () => {
  console.log(`ONLINE ${client.user.tag}`);
});

// =========================
// FUNZIONE STIPENDI + TASSE + DM
// =========================
async function processSalaries() {
  for (const guild of client.guilds.cache.values()) {
    const members = await guild.members.fetch();

    members.forEach(async (member) => {
      let totalSalary = 0;
      member.roles.cache.forEach(role => {
        if (SALARY_ROLES[role.name]) totalSalary += SALARY_ROLES[role.name];
      });

      if (totalSalary > 0) {
        const tax = Math.floor(totalSalary * TAX_RATE);
        const finalAmount = totalSalary - tax;
        econ.addMoney(member.id, finalAmount);

        try {
          await member.send(`💰 Stipendio giornaliero ricevuto\nLordo: ${totalSalary}\nTasse: ${tax}\nNetto: ${finalAmount}`);
        } catch {}
      }
    });
  }
  console.log("Stipendi giornalieri completati");
}

// CRON: ogni giorno a mezzanotte
cron.schedule('0 0 * * *', () => processSalaries());

// =========================
// INTERAZIONI BOTTONI GIOCATORE + ADMIN
// =========================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const user = await econ.getUser(interaction.user.id, interaction.user.username);

  // PANNELLO GIOCATORE
  if (interaction.customId === 'open_panel') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('profilo').setLabel('Profilo').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('soldi').setLabel('Denaro').setStyle(ButtonStyle.Success)
    );
    return interaction.user.send({ content: '📜 Menu giocatore', components: [row] });
  }

  if (interaction.customId === 'profilo') {
    return interaction.user.send(`👤 Profilo\nNome: ${user.name}\nDenaro: ${user.money}`);
  }

  if (interaction.customId === 'soldi') {
    return interaction.user.send(`💰 Hai ${user.money} monete`);
  }

  // PANNELLO ADMIN AVANZATO
  if (interaction.customId === 'admin_panel') {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'Non puoi usare questo comando', ephemeral: true });
    }

    const users = await new Promise(resolve => {
      db.all("SELECT * FROM players", [], (err, rows) => resolve(rows));
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_add').setLabel('Aggiungi soldi').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin_subtract').setLabel('Rimuovi soldi').setStyle(ButtonStyle.Danger)
    );

    const text = users.map(u => `${u.name}: ${u.money}`).join('\n');
    return interaction.user.send({ content: `📊 Pannello Admin\n${text}`, components: [row] });
  }

  // BOTTONI ADMIN AGGIUNGI/SOTTRAI SOLDI
  if (interaction.customId === 'admin_add') {
    await interaction.user.send('Funzione aggiungi soldi da implementare con input');
  }

  if (interaction.customId === 'admin_subtract') {
    await interaction.user.send('Funzione sottrai soldi da implementare con input');
  }
});

// =========================
// COMANDO !menu
// =========================
client.on(Events.MessageCreate, async msg => {
  if (msg.content === '!menu') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_panel').setLabel('Apri Menu').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin_panel').setLabel('Admin').setStyle(ButtonStyle.Danger)
    );

    msg.reply({ content: 'Apri il pannello 👇', components: [row] });
  }
});

// LOGIN BOT
client.login(process.env.TOKEN);
