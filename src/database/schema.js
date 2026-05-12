/**
 * Run database migrations safely - adds columns if they don't exist
 */
function runMigrations(db) {
  const migrations = [
    // Add columns to users table
    { table: 'users', column: 'penalty_points', type: 'INTEGER DEFAULT 0' },
    { table: 'users', column: 'sp_level', type: 'INTEGER DEFAULT 0' },
    { table: 'users', column: 'last_violation_at', type: 'DATETIME' },
    { table: 'users', column: 'last_decay_at', type: 'DATETIME' },
    { table: 'users', column: 'last_good_report_at', type: 'DATETIME' },
    { table: 'users', column: 'auto_mod_enabled', type: 'INTEGER DEFAULT 1' }
  ];

  for (const mig of migrations) {
    try {
      const checkSql = `SELECT ${mig.column} FROM ${mig.table} LIMIT 1`;
      db.exec(checkSql);
    } catch (e) {
      // Column doesn't exist, add it
      try {
        db.exec(`ALTER TABLE ${mig.table} ADD COLUMN ${mig.column} ${mig.type}`);
        console.log(`Migration: Added ${mig.column} to ${mig.table}`);
      } catch (addError) {
        // Ignore if already exists
      }
    }
  }
}

export function createTables(db) {
  // Run migrations first
  runMigrations(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      username TEXT,
      guild_id TEXT NOT NULL,
      total_warnings INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      penalty_points INTEGER DEFAULT 0,
      sp_level INTEGER DEFAULT 0,
      last_violation_at DATETIME,
      last_decay_at DATETIME,
      last_good_report_at DATETIME,
      auto_mod_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('ringan', 'sedang', 'berat')),
      points INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      guild_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      assignee_id TEXT,
      deadline DATETIME,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL UNIQUE,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      user_id TEXT,
      target_id TEXT,
      guild_id TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS penalty_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      penalty_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT,
      guild_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      points_change INTEGER NOT NULL,
      points_before INTEGER NOT NULL,
      points_after INTEGER NOT NULL,
      sp_level_before INTEGER DEFAULT 0,
      sp_level_after INTEGER DEFAULT 0,
      reason TEXT,
      evidence TEXT,
      moderator_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bad_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      word TEXT NOT NULL,
      severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
      points INTEGER DEFAULT 3,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, word)
    );

    CREATE TABLE IF NOT EXISTS good_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT UNIQUE NOT NULL,
      guild_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      points_reduction INTEGER DEFAULT 3,
      handled_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_warnings_user_id ON warnings(user_id);
    CREATE INDEX IF NOT EXISTS idx_warnings_case_id ON warnings(case_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_penalty_logs_user_id ON penalty_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_penalty_logs_guild_id ON penalty_logs(guild_id);
    CREATE INDEX IF NOT EXISTS idx_bad_words_guild_id ON bad_words(guild_id);
    CREATE INDEX IF NOT EXISTS idx_good_reports_status ON good_reports(status);
  `);
}