import { getOne, getAll, runQuery } from '../db.js';

export const auditLogRepository = {
  create(action, userId, targetId, guildId, details) {
    const sql = `INSERT INTO audit_logs (action, user_id, target_id, guild_id, details)
      VALUES (?, ?, ?, ?, ?)`;
    return runQuery(sql, [action, userId || null, targetId || null, guildId, details ? JSON.stringify(details) : null]);
  },

  findById(id) {
    return getOne('SELECT * FROM audit_logs WHERE id = ?', [id]);
  },

  findByAction(action, limit = 100) {
    return getAll('SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?', [action, limit]);
  },

  findByUser(userId, limit = 100) {
    return getAll('SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
  },

  findByGuild(guildId, limit = 200) {
    return getAll('SELECT * FROM audit_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?', [guildId, limit]);
  },

  findByDateRange(guildId, startDate, endDate) {
    return getAll(
      'SELECT * FROM audit_logs WHERE guild_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [guildId, startDate, endDate]
    );
  },

  deleteOld(daysToKeep = 90) {
    return runQuery(
      'DELETE FROM audit_logs WHERE created_at < datetime("now", ?||" days")',
      [-daysToKeep]
    );
  },

  getRecentActions(guildId, limit = 50) {
    return getAll('SELECT * FROM audit_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?', [guildId, limit]);
  }
};

export default auditLogRepository;