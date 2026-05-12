import { getOne, getAll, runQuery } from '../db.js';
import { generatePenaltyId } from '../../utils/idGenerator.js';

export const penaltyRepository = {
  createPenaltyLog(userId, username, guildId, actionType, pointsChange, pointsBefore, pointsAfter, spLevelBefore, spLevelAfter, reason = null, evidence = null, moderatorId = null) {
    const penaltyId = generatePenaltyId();
    const sql = `INSERT INTO penalty_logs (penalty_id, user_id, username, guild_id, action_type, points_change, points_before, points_after, sp_level_before, sp_level_after, reason, evidence, moderator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return runQuery(sql, [penaltyId, userId, username, guildId, actionType, pointsChange, pointsBefore, pointsAfter, spLevelBefore, spLevelAfter, reason, evidence, moderatorId]);
  },

  findPenaltyLogsByUser(userId, guildId, limit = 10) {
    return getAll(
      'SELECT * FROM penalty_logs WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, guildId, limit]
    );
  },

  getUserPenalty(userId, guildId) {
    return getOne('SELECT * FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
  },

  updateUserPenalty(userId, guildId, points, spLevel) {
    const sql = `UPDATE users SET penalty_points = ?, sp_level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`;
    return runQuery(sql, [points, spLevel, userId, guildId]);
  },

  updateLastViolation(userId, guildId) {
    const sql = `UPDATE users SET last_violation_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`;
    return runQuery(sql, [userId, guildId]);
  },

  updateLastDecay(userId, guildId) {
    const sql = `UPDATE users SET last_decay_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`;
    return runQuery(sql, [userId, guildId]);
  },

  getUsersForDecay(guildId, hours) {
    return getAll(
      `SELECT * FROM users WHERE guild_id = ? AND penalty_points > 0 AND (last_decay_at IS NULL OR last_decay_at < datetime('now', '-${hours} hours'))`,
      [guildId]
    );
  },

  resetPenalty(userId, guildId, resetSpLevel = false) {
    if (resetSpLevel) {
      const sql = `UPDATE users SET penalty_points = 0, sp_level = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`;
      return runQuery(sql, [userId, guildId]);
    } else {
      const sql = `UPDATE users SET penalty_points = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`;
      return runQuery(sql, [userId, guildId]);
    }
  },

  getPenaltyStats(guildId) {
    const result = getOne(`
      SELECT
        COUNT(CASE WHEN penalty_points > 0 THEN 1 END) as users_with_penalty,
        COUNT(CASE WHEN sp_level = 1 THEN 1 END) as sp1_count,
        COUNT(CASE WHEN sp_level >= 2 THEN 1 END) as sp2_count,
        COUNT(CASE WHEN action_type = 'BAD_WORD' THEN 1 END) as auto_mod_triggers
      FROM penalty_logs WHERE guild_id = ?
    `, [guildId]);
    return result || { users_with_penalty: 0, sp1_count: 0, sp2_count: 0, auto_mod_triggers: 0 };
  }
};

export default penaltyRepository;