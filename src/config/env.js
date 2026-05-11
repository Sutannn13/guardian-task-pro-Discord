import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const REQUIRED_ENV_VARS = ['DISCORD_TOKEN', 'CLIENT_ID'];

const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  GUILD_ID: process.env.GUILD_ID || '',
  MOD_LOG_CHANNEL_ID: process.env.MOD_LOG_CHANNEL_ID || '',
  REPORT_CHANNEL_ID: process.env.REPORT_CHANNEL_ID || '',
  TASK_MANAGER_ROLE_IDS: (process.env.TASK_MANAGER_ROLE_IDS || '')
    .split(',').map(id => id.trim()).filter(id => id.length > 0),
  DATABASE_PATH: process.env.DATABASE_PATH || './data/database.sqlite',
  PREFIX: process.env.PREFIX || '!',
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  OWNER_ID: process.env.OWNER_ID || ''
};

export function validateConfig() {
  const missing = REQUIRED_ENV_VARS.filter(key => !config[key] || config[key].trim() === '');
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error('   - ' + key));
    console.error('\nPlease copy .env.example to .env and fill in the values.');
    return false;
  }
  return true;
}

export function get(key, defaultValue = null) {
  return config[key] !== undefined ? config[key] : defaultValue;
}

export default config;