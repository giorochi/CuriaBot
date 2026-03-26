const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, SlashCommandBuilder, REST, Routes } = require('discord.js');
      econ.updateMoney(id, -50);
      interaction.user.send('Indulgenza acquistata');
      return interaction.reply({ content: 'Fatto', ephemeral: true });

    if (interaction.commandName === 'panel') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profile').setLabel('Profilo').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('economy').setLabel('Economia').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('properties').setLabel('Proprietà').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ content: 'Apri menu', components: [row], ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const id = interaction.user.id;
    const user = await econ.getUser(id);

    if (interaction.customId === 'profile') {
      interaction.user.send(`Profilo: ${JSON.stringify(user, null, 2)}`);
    }

    if (interaction.customId === 'economy') {
      interaction.user.send(`Denaro: ${user.money}`);
    }

    if (interaction.customId === 'properties') {
      interaction.user.send(`Proprietà: ${user.properties || 'Nessuna'}`);
    }

    interaction.reply({ content: 'Controlla DM', ephemeral: true });
  }
});

// =========================
// ADMIN
// =========================
client.on(Events.MessageCreate, msg => {
  if (!msg.member?.permissions.has("Administrator")) return;
  const args = msg.content.split(" ");

  if (args[0] === '!setrole') {
    const user = msg.mentions.users.first();
    const role = args.slice(2).join(" ");
    db.run("UPDATE players SET role = ?, rank = ? WHERE id = ?", [role, ROLES[role] || 0, user.id]);
    msg.reply('Ruolo aggiornato');
  }

  if (args[0] === '!setsalary') {
    const user = msg.mentions.users.first();
    const amount = parseInt(args[2]);
    db.run("UPDATE players SET salary = ? WHERE id = ?", [amount, user.id]);
    msg.reply('Stipendio aggiornato');
  }
});

client.login(TOKEN);
