require('dotenv').config();
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

// INTERAZIONI
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
      if (user.money < 10) return interaction.reply({ content: 'Povero.', ephemeral: true });
      econ.addMoney(interaction.user.id, -10);
      return interaction.reply({ content: 'Donazione fatta', ephemeral: true });
    }

    if (interaction.commandName === 'indulgenza') {
      if (user.money < 50) return interaction.reply({ content: 'Non hai soldi', ephemeral: true });
      econ.addMoney(interaction.user.id, -50);
      return interaction.reply({ content: 'Indulgenza ottenuta', ephemeral: true });
    }

    if (interaction.commandName === 'panel') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('economy').setLabel('Economia').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('properties').setLabel('Proprietà').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ content: 'Menu', components: [row], ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const user = await econ.getUser(interaction.user.id, interaction.user.username);

    if (interaction.customId === 'economy') {
      interaction.user.send(`Denaro: ${user.money}`);
    }

    if (interaction.customId === 'properties') {
      interaction.user.send(`Proprietà: ${user.properties || 'Nessuna'}`);
    }

    interaction.reply({ content: 'Controlla DM', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
