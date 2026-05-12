import warningRepository from '../database/repositories/warningRepository.js';
import userRepository from '../database/repositories/userRepository.js';
import auditLogService from './auditLogService.js';
import { generateCaseId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';

const SEVERITY_POINTS = {
  ringan: 1,
  sedang: 3,
  berat: 5
};

const SEVERITY_DESCRIPTIONS = {
  ringan: 'Pelanggaran ringan - Peringatan verbal atau书面',
  sedang: 'Pelanggaran sedang - Tindakan korektif diperlukan',
  berat: 'Pelanggaran berat - Tindakan disiplin diperlukan'
};

export async function createWarning(userId, username, moderatorId, guildId, reason, severity = 'sedang') {
  try {
    if (!SEVERITY_POINTS[severity]) {
      throw new Error('Tingkat keparahan tidak valid. Gunakan: ringan, sedang, berat');
    }

    const caseId = generateCaseId();
    const points = SEVERITY_POINTS[severity];

    userRepository.create(userId, username, guildId);
    warningRepository.create(caseId, userId, moderatorId, guildId, reason, severity, points);
    userRepository.incrementWarnings(userId, points);

    await auditLogService.logAction(
      'WARNING_CREATED',
      moderatorId,
      userId,
      guildId,
      { caseId, reason, severity, points }
    );

    const userWarnings = warningRepository.getUserWarningCount(userId);

    logger.info(`Warning created: ${caseId} for user ${userId}`);
    return {
      success: true,
      caseId,
      points,
      totalWarnings: userWarnings.count,
      totalPoints: userWarnings.total_points
    };
  } catch (error) {
    logger.error('Failed to create warning', error);
    throw error;
  }
}

export async function removeWarning(caseId, moderatorId, guildId) {
  try {
    const warning = warningRepository.findByCaseId(caseId);
    if (!warning) {
      throw new Error('Peringatan tidak ditemukan');
    }

    warningRepository.delete(caseId);
    userRepository.decrementWarnings(warning.user_id, warning.points);

    await auditLogService.logAction(
      'WARNING_REMOVED',
      moderatorId,
      warning.user_id,
      guildId,
      { caseId, severity: warning.severity, points: warning.points }
    );

    logger.info(`Warning removed: ${caseId}`);
    return { success: true, caseId };
  } catch (error) {
    logger.error('Failed to remove warning', error);
    throw error;
  }
}

export async function getUserWarnings(userId) {
  try {
    return warningRepository.findByUserId(userId);
  } catch (error) {
    logger.error('Failed to get user warnings', error);
    throw error;
  }
}

export async function getGuildWarnings(guildId, limit = 50) {
  try {
    return warningRepository.findByGuild(guildId, limit);
  } catch (error) {
    logger.error('Failed to get guild warnings', error);
    throw error;
  }
}

export function getSeverityInfo() {
  return Object.entries(SEVERITY_POINTS).map(([level, points]) => ({
    level,
    points,
    description: SEVERITY_DESCRIPTIONS[level]
  }));
}

export default {
  createWarning,
  removeWarning,
  getUserWarnings,
  getGuildWarnings,
  getSeverityInfo
};