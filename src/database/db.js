import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import { createTables } from './schema.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../' + config.DATABASE_PATH);

let db = null;

export function getDatabase() {
  if (!db) {
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      createTables(db);
      logger.info('Database connected: ' + dbPath);
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

export function runQuery(sql, params = []) {
  const database = getDatabase();
  try {
    return database.prepare(sql).run(...params);
  } catch (error) {
    logger.error('Query failed: ' + sql, error);
    throw error;
  }
}

export function getOne(sql, params = []) {
  const database = getDatabase();
  try {
    return database.prepare(sql).get(...params);
  } catch (error) {
    logger.error('Query failed: ' + sql, error);
    throw error;
  }
}

export function getAll(sql, params = []) {
  const database = getDatabase();
  try {
    return database.prepare(sql).all(...params);
  } catch (error) {
    logger.error('Query failed: ' + sql, error);
    throw error;
  }
}

export default { getDatabase, closeDatabase, runQuery, getOne, getAll };