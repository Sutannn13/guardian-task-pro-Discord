import auditLogRepository from '../database/repositories/auditLogRepository.js';
import logger from '../utils/logger.js';

export async function logAction(action, userId, targetId, guildId, details = null) {
  try {
    const result = auditLogRepository.create(action, userId, targetId, guildId, details);
    logger.debug(`Audit log created: ${action}`, { userId, targetId, guildId });
    return result;
  } catch (error) {
    logger.error('Failed to create audit log', error);
    throw error;
  }
}

export async function getAuditLogs(guildId, limit = 50) {
  try {
    return auditLogRepository.getRecentActions(guildId, limit);
  } catch (error) {
    logger.error('Failed to get audit logs', error);
    throw error;
  }
}

export async function getUserAuditLogs(userId, limit = 50) {
  try {
    return auditLogRepository.findByUser(userId, limit);
  } catch (error) {
    logger.error('Failed to get user audit logs', error);
    throw error;
  }
}

export async function getActionAuditLogs(action, limit = 50) {
  try {
    return auditLogRepository.findByAction(action, limit);
  } catch (error) {
    logger.error('Failed to get action audit logs', error);
    throw error;
  }
}

export async function cleanupOldLogs(daysToKeep = 90) {
  try {
    const result = auditLogRepository.deleteOld(daysToKeep);
    logger.info(`Cleaned up audit logs older than ${daysToKeep} days`);
    return result;
  } catch (error) {
    logger.error('Failed to cleanup old logs', error);
    throw error;
  }
}

export default { logAction, getAuditLogs, getUserAuditLogs, getActionAuditLogs, cleanupOldLogs };