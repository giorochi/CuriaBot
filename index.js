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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`ONLINE ${client.user.tag}`);
});

// STIPENDI AUTOMATICI
cron.schedule('0 * * * *', () => {
  db.run("UPDATE players SET money = money + salary");
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const user = await econ.getUser(interaction.user.id, interaction.user.username);

    if (user.isExcommunicated) {
      return interaction.reply({ content: 'Sei scomunicato.', ephemeral: true });
    }

    if (interaction.commandName === 'profilo') {
      await interaction.user.send(`Denaro: ${user.money}\nRuolo: ${user.role}`);
      return interaction.reply({ content: 'Controlla DM', ephemeral: true });
    }

    if (interaction.commandName === 'dona') {
      if (user.money < 10) return interaction.reply({ content: 'Sei senza soldi.', ephemeral: true });
      econ.addMoney(user.id, -10);
      return interaction.reply({ content: 'Donazione fatta', ephemeral: true });
    }

    if (interaction.commandName === 'indulgenza') {
      if (user.money < 50) return interaction.reply({ content: 'Non hai abbastanza denaro', ephemeral: true });
      econ.addMoney(user.id, -50);
      return interaction.reply({ content: 'Indulgenza ottenuta', ephemeral: true });
    }

    if (interaction.commandName === 'panel') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profilo_btn').setLabel('Profilo').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('economia_btn').setLabel('Economia').setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: 'Apri il menu', components: [row], ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const user = await econ.getUser(interaction.user.id, interaction.user.username);

    if (interaction.customId === 'profilo_btn') {
      interaction.user.send(`Profilo:\nDenaro: ${user.money}\nRuolo: ${user.role}`);
    }

    if (interaction.customId === 'economia_btn') {
      interaction.user.send(`Denaro attuale: ${user.money}`);
    }

    interaction.reply({ content: 'Controlla i DM', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
