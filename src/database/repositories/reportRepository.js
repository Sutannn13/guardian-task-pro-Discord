import { getOne, getAll, runQuery } from '../db.js';

export const reportRepository = {
  create(reportId, reporterId, reportedUserId, guildId, reason, evidence) {
    const sql = `INSERT INTO reports (report_id, reporter_id, reported_user_id, guild_id, reason, evidence)
      VALUES (?, ?, ?, ?, ?, ?)`;
    return runQuery(sql, [reportId, reporterId, reportedUserId, guildId, reason, evidence]);
  },

  findByReportId(reportId) {
    return getOne('SELECT * FROM reports WHERE report_id = ?', [reportId]);
  },

  findByReporter(reporterId) {
    return getAll('SELECT * FROM reports WHERE reporter_id = ? ORDER BY created_at DESC', [reporterId]);
  },

  findByReportedUser(reportedUserId) {
    return getAll('SELECT * FROM reports WHERE reported_user_id = ? ORDER BY created_at DESC', [reportedUserId]);
  },

  findByGuild(guildId) {
    return getAll('SELECT * FROM reports WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
  },

  findByStatus(status) {
    return getAll('SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC', [status]);
  },

  updateStatus(reportId, status) {
    return runQuery(
      'UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE report_id = ?',
      [status, reportId]
    );
  },

  delete(reportId) {
    return runQuery('DELETE FROM reports WHERE report_id = ?', [reportId]);
  },

  getReportStats(guildId) {
    return getOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
      FROM reports WHERE guild_id = ?
    `, [guildId]);
  }
};

export default reportRepository;