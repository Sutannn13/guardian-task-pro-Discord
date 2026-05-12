import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands(client, commandsPath) {
  const commands = [];

  // Recursively load all command files from subdirectories
  async function loadFromDirectory(dirPath) {
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively load from subdirectory
          await loadFromDirectory(fullPath);
        } else if (entry.name.endsWith('.js')) {
          try {
            const fileUrl = pathToFileURL(fullPath).href;
            const command = await import(fileUrl);

            if (command.default && typeof command.default.data !== 'undefined') {
              commands.push(command.default);
              logger.debug(`Loaded command: ${command.default.data.name} from ${fullPath}`);
            } else if (command.data && typeof command.execute === 'function') {
              commands.push(command);
              logger.debug(`Loaded command: ${command.data.name} from ${fullPath}`);
            }
          } catch (error) {
            logger.error(`Failed to load command ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      logger.warn(`Directory not accessible: ${dirPath}`);
    }
  }

  // Start loading from commands directory
  await loadFromDirectory(commandsPath);

  client.commands = new Map();
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  logger.info(`Total commands loaded: ${commands.length}`);
  return commands;
}

export async function loadAllCommands() {
  const commandsPath = join(__dirname, '../commands');
  return loadCommands(null, commandsPath);
}

export default { loadCommands, loadAllCommands };