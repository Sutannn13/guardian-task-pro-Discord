import config from '../config/env.js';

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = config.DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO;

function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (data) {
    return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message, data = null) {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(formatMessage('DEBUG', message, data));
    }
  },

  info(message, data = null) {
    if (currentLevel <= LogLevel.INFO) {
      console.log(formatMessage('INFO', message, data));
    }
  },

  warn(message, data = null) {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(formatMessage('WARN', message, data));
    }
  },

  error(message, error = null) {
    if (currentLevel <= LogLevel.ERROR) {
      if (error instanceof Error) {
        console.error(formatMessage('ERROR', message, {
          name: error.name,
          message: error.message,
          stack: error.stack
        }));
      } else {
        console.error(formatMessage('ERROR', message, error));
      }
    }
  },

  success(message, data = null) {
    if (currentLevel <= LogLevel.INFO) {
      console.log(formatMessage('SUCCESS', message, data));
    }
  }
};

export default logger;