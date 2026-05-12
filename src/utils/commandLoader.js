import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands(client, commandsPath) {
  const commands = [];
  const folders = ['general', 'moderation', 'task', 'report'];

  for (const folder of folders) {
    const folderPath = join(commandsPath, folder);

    try {
      const files = readdirSync(folderPath).filter(file => file.endsWith('.js'));

      for (const file of files) {
        const filePath = join(folderPath, file);
        try {
          const fileUrl = pathToFileURL(filePath).href;
          const command = await import(fileUrl);

          if (command.default && typeof command.default.data !== 'undefined') {
            commands.push(command.default);
            logger.debug(`Loaded command: ${command.default.data.name} from ${folder}/${file}`);
          } else if (command.data && typeof command.execute === 'function') {
            commands.push(command);
            logger.debug(`Loaded command: ${command.data.name} from ${folder}/${file}`);
          }
        } catch (error) {
          logger.error(`Failed to load command ${file}:`, error);
        }
      }
    } catch (error) {
      logger.warn(`No commands found in ${folder} folder`);
    }
  }

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