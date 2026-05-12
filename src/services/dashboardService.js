import userRepository from '../database/repositories/userRepository.js';
import warningRepository from '../database/repositories/warningRepository.js';
import taskRepository from '../database/repositories/taskRepository.js';
import reportRepository from '../database/repositories/reportRepository.js';
import logger from '../utils/logger.js';

export async function getServerStats(guild) {
  try {
    if (!guild) {
      return null;
    }

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.presences?.cache?.size || 0;
    const totalChannels = guild.channels.cache.size;
    const totalRoles = guild.roles.cache.size;

    return {
      totalMembers,
      onlineMembers,
      totalChannels,
      totalRoles,
      serverName: guild.name,
      serverIcon: guild.iconURL() || null
    };
  } catch (error) {
    logger.error('Failed to get server stats', error);
    throw error;
  }
}

export async function getModerationStats(guildId) {
  try {
    const warnings = warningRepository.findByGuild(guildId, 100);
    const recentWarnings = warningRepository.getRecentWarnings(guildId, 7);

    const totalWarnings = warnings.length;
    const weeklyWarnings = recentWarnings.length;

    const severityCounts = {
      ringan: warnings.filter(w => w.severity === 'ringan').length,
      sedang: warnings.filter(w => w.severity === 'sedang').length,
      berat: warnings.filter(w => w.severity === 'berat').length
    };

    return {
      totalWarnings: totalWarnings || 0,
      weeklyWarnings: weeklyWarnings || 0,
      severityCounts
    };
  } catch (error) {
    logger.error('Failed to get moderation stats', error);
    return { totalWarnings: 0, weeklyWarnings: 0, severityCounts: { ringan: 0, sedang: 0, berat: 0 } };
  }
}

export async function getTaskStats(guildId) {
  try {
    const stats = taskRepository.getTaskStats(guildId);
    const overdueTasks = taskRepository.getOverdueTasks(guildId);

    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      in_progress: stats?.in_progress || 0,
      completed: stats?.completed || 0,
      overdueCount: overdueTasks?.length || 0
    };
  } catch (error) {
    logger.error('Failed to get task stats', error);
    return { total: 0, pending: 0, in_progress: 0, completed: 0, overdueCount: 0 };
  }
}

export async function getReportStats(guildId) {
  try {
    const stats = reportRepository.getReportStats(guildId);
    return {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      resolved: stats?.resolved || 0
    };
  } catch (error) {
    logger.error('Failed to get report stats', error);
    return { total: 0, pending: 0, resolved: 0 };
  }
}

export async function getTopUsers(guildId, limit = 10) {
  try {
    const users = userRepository.getTopUsers(guildId, limit);
    return users || [];
  } catch (error) {
    logger.error('Failed to get top users', error);
    return [];
  }
}

export async function getFullDashboard(guild) {
  try {
    if (!guild) {
      return null;
    }

    const [
      serverStats,
      modStats,
      taskStats,
      reportStats,
      topUsers
    ] = await Promise.all([
      getServerStats(guild),
      getModerationStats(guild.id),
      getTaskStats(guild.id),
      getReportStats(guild.id),
      getTopUsers(guild.id, 5)
    ]);

    return {
      server: serverStats,
      moderation: modStats,
      tasks: taskStats,
      reports: reportStats,
      topUsers
    };
  } catch (error) {
    logger.error('Failed to get full dashboard', error);
    throw error;
  }
}

export default {
  getServerStats,
  getModerationStats,
  getTaskStats,
  getReportStats,
  getTopUsers,
  getFullDashboard
};