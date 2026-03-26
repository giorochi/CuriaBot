const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('profilo').setDescription('Mostra profilo'),
  new SlashCommandBuilder().setName('dona').setDescription('Dona 10'),
  new SlashCommandBuilder().setName('indulgenza').setDescription('Compra indulgenza'),
  new SlashCommandBuilder().setName('panel').setDescription('Menu principale')
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function deploy() {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Comandi registrati');
  } catch (err) {
    console.error(err);
  }
}

deploy();
