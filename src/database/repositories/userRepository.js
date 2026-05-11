import { getOne, getAll, runQuery } from '../db.js';

export const userRepository = {
  create(userId, username, guildId) {
    const sql = `INSERT INTO users (user_id, username, guild_id) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET username = ?, updated_at = CURRENT_TIMESTAMP`;
    return runQuery(sql, [userId, username, guildId, username]);
  },

  findByUserId(userId) {
    return getOne('SELECT * FROM users WHERE user_id = ?', [userId]);
  },

  findByGuild(guildId) {
    return getAll('SELECT * FROM users WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
  },

  updateUsername(userId, username) {
    return runQuery('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [username, userId]);
  },

  incrementWarnings(userId, points) {
    return runQuery(
      'UPDATE users SET total_warnings = total_warnings + 1, total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [points, userId]
    );
  },

  decrementWarnings(userId, points) {
    return runQuery(
      'UPDATE users SET total_warnings = total_warnings - 1, total_points = total_points - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [points, userId]
    );
  },

  delete(userId) {
    return runQuery('DELETE FROM users WHERE user_id = ?', [userId]);
  },

  getTopUsers(guildId, limit = 10) {
    return getAll(
      'SELECT * FROM users WHERE guild_id = ? ORDER BY total_points DESC LIMIT ?',
      [guildId, limit]
    );
  }
};

export default userRepository;