import { Client, GatewayIntentBits, Collection } from 'discord.js';
import config, { validateConfig } from './config/env.js';
import logger from './utils/logger.js';
import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { getDatabase, closeDatabase } from './database/db.js';

// Create client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: ['MESSAGE', 'CHANNEL', 'USER']
});

// Initialize commands collection
client.commands = new Collection();

// Register event handlers
client.once('ready', async () => {
  await onReady(client);
});

client.on('interactionCreate', async (interaction) => {
  await onInteractionCreate(interaction);
});

// Handle errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down bot...');
  closeDatabase();
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down bot...');
  closeDatabase();
  await client.destroy();
  process.exit(0);
});

// Start the bot
async function startBot() {
  try {
    // Validate configuration
    if (!validateConfig()) {
      logger.error('Configuration validation failed. Please check your .env file.');
      process.exit(1);
    }

    // Initialize database
    logger.info('Initializing database...');
    getDatabase();

    // Login to Discord
    logger.info('Logging in to Discord...');
    await client.login(config.DISCORD_TOKEN);
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();