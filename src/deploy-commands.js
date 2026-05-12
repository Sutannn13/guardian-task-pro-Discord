import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config, { validateConfig } from './config/env.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadCommands() {
  const commands = [];
  const folders = ['general', 'moderation', 'task', 'report'];

  for (const folder of folders) {
    const folderPath = join(__dirname, 'commands', folder);

    try {
      const files = readdirSync(folderPath).filter(file => file.endsWith('.js'));

      for (const file of files) {
        try {
          const commandPath = join(folderPath, file);
          const commandUrl = pathToFileURL(commandPath).href;
          const command = await import(commandUrl);

          if (command.default?.data) {
            commands.push(command.default.data.toJSON());
          } else if (command.data) {
            commands.push(command.data.toJSON());
          }
        } catch (error) {
          logger.error(`Failed to load command ${file}:`, error);
        }
      }
    } catch (error) {
      logger.warn(`No commands found in ${folder} folder`);
    }
  }

  return commands;
}

async function deployCommands() {
  console.log('🚀 Starting command deployment...\n');

  if (!validateConfig()) {
    console.error('❌ Configuration validation failed');
    process.exit(1);
  }

  const commands = await loadCommands();
  console.log(`📋 Loaded ${commands.length} commands`);

  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

  try {
    console.log('\n⏳ Deploying commands...');

    if (config.GUILD_ID) {
      // Deploy to specific guild
      const data = await rest.put(
        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
        { body: commands }
      );

      console.log(`
╔═══════════════════════════════════════════╗
║     ✅ Commands Deployed Successfully!    ║
╠═══════════════════════════════════════════╣
║  🏠 Guild ID: ${config.GUILD_ID}
║  📋 Commands: ${data.length}
╚═══════════════════════════════════════════╝
      `);
    } else {
      // Deploy globally
      const data = await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
      );

      console.log(`
╔═══════════════════════════════════════════╗
║     ✅ Commands Deployed Globally!       ║
╠═══════════════════════════════════════════╣
║  📋 Commands: ${data.length}
║  ⚠️ Note: Global commands take up to 1 hour
╚═══════════════════════════════════════════╝
      `);
    }
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
    process.exit(1);
  }
}

deployCommands();