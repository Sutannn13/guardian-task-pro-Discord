import { getOne, getAll, runQuery } from '../db.js';

export const badWordRepository = {
  addWord(guildId, word, severity, points, createdBy) {
    const sql = `INSERT OR IGNORE INTO bad_words (guild_id, word, severity, points, created_by) VALUES (?, ?, ?, ?, ?)`;
    return runQuery(sql, [guildId, word.toLowerCase().trim(), severity || 'medium', points || 3, createdBy]);
  },

  removeWord(guildId, word) {
    return runQuery('DELETE FROM bad_words WHERE guild_id = ? AND word = ?', [guildId, word.toLowerCase().trim()]);
  },

  findByGuild(guildId) {
    return getAll('SELECT * FROM bad_words WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
  },

  findWord(guildId, word) {
    return getOne('SELECT * FROM bad_words WHERE guild_id = ? AND word = ?', [guildId, word.toLowerCase().trim()]);
  },

  updateWord(guildId, word, data) {
    const fields = [];
    const values = [];

    if (data.severity) {
      fields.push('severity = ?');
      values.push(data.severity);
    }
    if (data.points !== undefined) {
      fields.push('points = ?');
      values.push(data.points);
    }

    if (fields.length === 0) return null;

    values.push(guildId, word.toLowerCase().trim());
    return runQuery(`UPDATE bad_words SET ${fields.join(', ')} WHERE guild_id = ? AND word = ?`, values);
  },

  seedDefaultWords(guildId) {
    const defaults = [
      { word: 'badword1', severity: 'medium', points: 3 },
      { word: 'badword2', severity: 'medium', points: 3 }
    ];

    for (const word of defaults) {
      this.addWord(guildId, word.word, word.severity, word.points, null);
    }
  }
};

export default badWordRepository;