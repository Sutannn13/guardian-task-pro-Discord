import { getOne, getAll, runQuery } from '../db.js';

export const goodReportRepository = {
  create(reportId, guildId, reporterId, targetUserId, reason, pointsReduction = 3) {
    const sql = `INSERT INTO good_reports (report_id, guild_id, reporter_id, target_user_id, reason, points_reduction) VALUES (?, ?, ?, ?, ?, ?)`;
    return runQuery(sql, [reportId, guildId, reporterId, targetUserId, reason, pointsReduction]);
  },

  findByReportId(reportId) {
    return getOne('SELECT * FROM good_reports WHERE report_id = ?', [reportId]);
  },

  findPending(guildId) {
    return getAll('SELECT * FROM good_reports WHERE guild_id = ? AND status = ? ORDER BY created_at DESC', [guildId, 'pending']);
  },

  updateStatus(reportId, status, handledBy) {
    const sql = `UPDATE good_reports SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP WHERE report_id = ?`;
    return runQuery(sql, [status, handledBy, reportId]);
  },

  findByTargetUser(targetUserId, guildId) {
    return getAll('SELECT * FROM good_reports WHERE target_user_id = ? AND guild_id = ? ORDER BY created_at DESC', [targetUserId, guildId]);
  },

  canCreateReport(reporterId, targetUserId, guildId, hoursCooldown = 6) {
    const result = getOne(`
      SELECT COUNT(*) as count FROM good_reports
      WHERE reporter_id = ? AND target_user_id = ? AND guild_id = ?
      AND created_at > datetime('now', '-${hoursCooldown} hours')
    `, [reporterId, targetUserId, guildId]);
    return (result?.count || 0) === 0;
  },

  getPendingCount(guildId) {
    const result = getOne('SELECT COUNT(*) as count FROM good_reports WHERE guild_id = ? AND status = ?', [guildId, 'pending']);
    return result?.count || 0;
  }
};

export default goodReportRepository;