import { getOne, getAll, runQuery } from '../db.js';

export const warningRepository = {
  create(caseId, userId, moderatorId, guildId, reason, severity, points) {
    const sql = `INSERT INTO warnings (case_id, user_id, moderator_id, guild_id, reason, severity, points)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    return runQuery(sql, [caseId, userId, moderatorId, guildId, reason, severity, points]);
  },

  findByCaseId(caseId) {
    return getOne('SELECT * FROM warnings WHERE case_id = ?', [caseId]);
  },

  findByUserId(userId) {
    return getAll('SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },

  findByGuild(guildId, limit = 50) {
    return getAll(
      'SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?',
      [guildId, limit]
    );
  },

  findByModerator(moderatorId, limit = 50) {
    return getAll(
      'SELECT * FROM warnings WHERE moderator_id = ? ORDER BY created_at DESC LIMIT ?',
      [moderatorId, limit]
    );
  },

  delete(caseId) {
    return runQuery('DELETE FROM warnings WHERE case_id = ?', [caseId]);
  },

  getUserWarningCount(userId) {
    return getOne('SELECT COUNT(*) as count, SUM(points) as total_points FROM warnings WHERE user_id = ?', [userId]);
  },

  getRecentWarnings(guildId, days = 7) {
    return getAll(
      'SELECT * FROM warnings WHERE guild_id = ? AND created_at > datetime("now", ?||" days") ORDER BY created_at DESC',
      [guildId, -days]
    );
  }
};

export default warningRepository;