const {
    const members = await guild.members.fetch();

    for (const member of members.values()) {
      let totalSalary = 0;

      member.roles.cache.forEach(role => {
        if (SALARY_ROLES[role.name]) {
          totalSalary += SALARY_ROLES[role.name];
        }
      });

      if (totalSalary > 0) {
        const tax = Math.floor(totalSalary * TAX_RATE);
        const finalAmount = totalSalary - tax;

        econ.addMoney(member.id, finalAmount);

        try {
          await member.send(`💰 Stipendio ricevuto\nLordo: ${totalSalary}\nTasse: ${tax}\nNetto: ${finalAmount}`);
        } catch {}
      }
    }
  }

  console.log("Stipendi giornalieri completati");
}

// ogni giorno a mezzanotte
cron.schedule('0 0 * * *', processSalaries);

// =========================
// INTERFACCIA GIOCATORE
// =========================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const user = await econ.getUser(interaction.user.id, interaction.user.username);

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

  if (interaction.customId === 'admin_panel') {
    if (!interaction.member.permissions.has('Administrator')) return;

    const users = await new Promise(resolve => {
      db.all("SELECT * FROM players", [], (err, rows) => resolve(rows));
    });

    const text = users.map(u => `${u.name}: ${u.money}`).join("\n");

    return interaction.user.send(`📊 Pannello Admin\n${text}`);
  }
});

// =========================
// COMANDO PER APRIRE MENU
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

client.login(process.env.TOKEN);
