import { getOne, getAll, runQuery } from '../db.js';

export const taskRepository = {
  create(taskId, title, description, guildId, creatorId, assigneeId, deadline, priority) {
    const sql = `INSERT INTO tasks (task_id, title, description, guild_id, creator_id, assignee_id, deadline, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return runQuery(sql, [taskId, title, description, guildId, creatorId, assigneeId, deadline, priority]);
  },

  findByTaskId(taskId) {
    return getOne('SELECT * FROM tasks WHERE task_id = ?', [taskId]);
  },

  findByCreator(creatorId) {
    return getAll('SELECT * FROM tasks WHERE creator_id = ? ORDER BY created_at DESC', [creatorId]);
  },

  findByAssignee(assigneeId) {
    return getAll('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY created_at DESC', [assigneeId]);
  },

  findByGuild(guildId) {
    return getAll('SELECT * FROM tasks WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
  },

  findByStatus(status) {
    return getAll('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', [status]);
  },

  update(taskId, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(key + ' = ?');
        values.push(value);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(taskId);
    return runQuery('UPDATE tasks SET ' + fields.join(', ') + ' WHERE task_id = ?', values);
  },

  updateStatus(taskId, status) {
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    return runQuery(
      'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP, completed_at = ? WHERE task_id = ?',
      [status, completedAt, taskId]
    );
  },

  delete(taskId) {
    return runQuery('DELETE FROM tasks WHERE task_id = ?', [taskId]);
  },

  getTaskStats(guildId) {
    return getOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE guild_id = ?
    `, [guildId]);
  },

  getOverdueTasks(guildId) {
    return getAll(`
      SELECT * FROM tasks
      WHERE guild_id = ?
      AND status NOT IN ('completed', 'cancelled')
      AND deadline < datetime('now')
      ORDER BY deadline ASC
    `, [guildId]);
  }
};

export default taskRepository;