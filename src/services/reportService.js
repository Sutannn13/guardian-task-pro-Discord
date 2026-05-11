import reportRepository from '../database/repositories/reportRepository.js';
import auditLogService from './auditLogService.js';
import { generateReportId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';

const REPORT_STATUSES = {
  pending: { label: 'Menunggu', emoji: '⏳', color: 0xFFAA00 },
  reviewed: { label: 'Sedang Ditinjau', emoji: '👀', color: 0x0099FF },
  resolved: { label: 'Terselesaikan', emoji: '✅', color: 0x00FF00 },
  dismissed: { label: 'Ditolak', emoji: '❌', color: 0xFF0000 }
};

export async function createReport(reporterId, reportedUserId, guildId, reason, evidence = null) {
  try {
    if (!reason || reason.trim() === '') {
      throw new Error('Alasan laporan tidak boleh kosong');
    }

    const reportId = generateReportId();

    reportRepository.create(
      reportId,
      reporterId,
      reportedUserId,
      guildId,
      reason.trim(),
      evidence?.trim() || null
    );

    await auditLogService.logAction(
      'REPORT_CREATED',
      reporterId,
      reportedUserId,
      guildId,
      { reportId, reason: reason.trim() }
    );

    logger.info(`Report created: ${reportId} - reported: ${reportedUserId}`);
    return {
      success: true,
      reportId,
      reportedUserId,
      reason: reason.trim(),
      status: 'pending'
    };
  } catch (error) {
    logger.error('Failed to create report', error);
    throw error;
  }
}

export async function updateReportStatus(reportId, status, moderatorId = null) {
  try {
    if (!REPORT_STATUSES[status]) {
      throw new Error('Status tidak valid');
    }

    const report = reportRepository.findByReportId(reportId);
    if (!report) {
      throw new Error('Laporan tidak ditemukan');
    }

    reportRepository.updateStatus(reportId, status);

    await auditLogService.logAction(
      'REPORT_STATUS_UPDATED',
      moderatorId,
      report.reported_user_id,
      report.guild_id,
      { reportId, oldStatus: report.status, newStatus: status }
    );

    logger.info(`Report updated: ${reportId} - status: ${status}`);
    return { success: true, reportId, status };
  } catch (error) {
    logger.error('Failed to update report', error);
    throw error;
  }
}

export async function getReport(reportId) {
  try {
    return reportRepository.findByReportId(reportId);
  } catch (error) {
    logger.error('Failed to get report', error);
    throw error;
  }
}

export async function getUserReports(userId) {
  try {
    return reportRepository.findByReportedUser(userId);
  } catch (error) {
    logger.error('Failed to get user reports', error);
    throw error;
  }
}

export async function getReporterReports(reporterId) {
  try {
    return reportRepository.findByReporter(reporterId);
  } catch (error) {
    logger.error('Failed to get reporter reports', error);
    throw error;
  }
}

export async function getGuildReports(guildId) {
  try {
    return reportRepository.findByGuild(guildId);
  } catch (error) {
    logger.error('Failed to get guild reports', error);
    throw error;
  }
}

export async function getPendingReports(guildId) {
  try {
    return reportRepository.findByStatus('pending');
  } catch (error) {
    logger.error('Failed to get pending reports', error);
    throw error;
  }
}

export async function getReportStats(guildId) {
  try {
    return reportRepository.getReportStats(guildId);
  } catch (error) {
    logger.error('Failed to get report stats', error);
    throw error;
  }
}

export function getStatusInfo() {
  return Object.entries(REPORT_STATUSES).map(([status, data]) => ({
    status,
    label: data.label,
    emoji: data.emoji,
    color: data.color
  }));
}

export default {
  createReport,
  updateReportStatus,
  getReport,
  getUserReports,
  getReporterReports,
  getGuildReports,
  getPendingReports,
  getReportStats,
  getStatusInfo,
  REPORT_STATUSES
};