import logger from '../utils/logger.js';
import { loadCommands } from '../utils/commandLoader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function onReady(client) {
  try {
    logger.success('Bot is starting...');

    // Load commands
    const commandsPath = join(__dirname, '../commands');
    await loadCommands(client, commandsPath);

    // Set bot status
    client.user.setPresence({
      status: 'online',
      activities: [{
        name: 'GuardianTask Pro',
        type: 0 // Playing
      }]
    });

    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
    logger.info(`Loaded ${client.commands?.size || 0} commands`);

    // Send startup message to console
    console.log(`
╔═══════════════════════════════════════════╗
║     GuardianTask Pro - Bot Aktif!         ║
╠═══════════════════════════════════════════╣
║  👤 Bot: ${client.user.tag}
║  🏠 Guilds: ${client.guilds.cache.size}
║  ⌨️ Commands: ${client.commands?.size || 0}
╚═══════════════════════════════════════════╝
    `);
  } catch (error) {
    logger.error('Failed to initialize bot', error);
  }
}

export default onReady;