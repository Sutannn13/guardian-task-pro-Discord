import taskRepository from '../database/repositories/taskRepository.js';
import auditLogService from './auditLogService.js';
import { generateTaskId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';

const PRIORITIES = {
  low: { emoji: '🟢', color: 0x00FF00 },
  normal: { emoji: '🟡', color: 0xFFAA00 },
  high: { emoji: '🟠', color: 0xFF6600 },
  urgent: { emoji: '🔴', color: 0xFF0000 }
};

export async function createTask(title, description, guildId, creatorId, assigneeId = null, deadline = null, priority = 'normal') {
  try {
    if (!title || title.trim() === '') {
      throw new Error('Judul tugas tidak boleh kosong');
    }

    if (!PRIORITIES[priority]) {
      priority = 'normal';
    }

    const taskId = generateTaskId();

    taskRepository.create(
      taskId,
      title.trim(),
      description?.trim() || null,
      guildId,
      creatorId,
      assigneeId,
      deadline,
      priority
    );

    await auditLogService.logAction(
      'TASK_CREATED',
      creatorId,
      assigneeId,
      guildId,
      { taskId, title: title.trim(), priority }
    );

    logger.info(`Task created: ${taskId} - ${title}`);
    return {
      success: true,
      taskId,
      title: title.trim(),
      description: description?.trim() || null,
      priority,
      deadline,
      assigneeId
    };
  } catch (error) {
    logger.error('Failed to create task', error);
    throw error;
  }
}

export async function completeTask(taskId, userId, guildId) {
  try {
    const task = taskRepository.findByTaskId(taskId);
    if (!task) {
      throw new Error('Tugas tidak ditemukan');
    }

    if (task.status === 'completed') {
      throw new Error('Tugas sudah selesai');
    }

    if (task.status === 'cancelled') {
      throw new Error('Tugas sudah dibatalkan');
    }

    taskRepository.updateStatus(taskId, 'completed');

    await auditLogService.logAction(
      'TASK_COMPLETED',
      userId,
      task.creator_id,
      guildId,
      { taskId, title: task.title }
    );

    logger.info(`Task completed: ${taskId}`);
    return { success: true, taskId, title: task.title };
  } catch (error) {
    logger.error('Failed to complete task', error);
    throw error;
  }
}

export async function cancelTask(taskId, userId, guildId) {
  try {
    const task = taskRepository.findByTaskId(taskId);
    if (!task) {
      throw new Error('Tugas tidak ditemukan');
    }

    taskRepository.updateStatus(taskId, 'cancelled');

    await auditLogService.logAction(
      'TASK_CANCELLED',
      userId,
      task.creator_id,
      guildId,
      { taskId, title: task.title }
    );

    logger.info(`Task cancelled: ${taskId}`);
    return { success: true, taskId };
  } catch (error) {
    logger.error('Failed to cancel task', error);
    throw error;
  }
}

export async function updateTask(taskId, updates, userId, guildId) {
  try {
    const task = taskRepository.findByTaskId(taskId);
    if (!task) {
      throw new Error('Tugas tidak ditemukan');
    }

    taskRepository.update(taskId, updates);

    await auditLogService.logAction(
      'TASK_UPDATED',
      userId,
      task.creator_id,
      guildId,
      { taskId, updates }
    );

    logger.info(`Task updated: ${taskId}`);
    return { success: true, taskId };
  } catch (error) {
    logger.error('Failed to update task', error);
    throw error;
  }
}

export async function getTasks(guildId, status = null) {
  try {
    if (status) {
      return taskRepository.findByStatus(status);
    }
    return taskRepository.findByGuild(guildId);
  } catch (error) {
    logger.error('Failed to get tasks', error);
    throw error;
  }
}

export async function getUserTasks(userId) {
  try {
    const created = taskRepository.findByCreator(userId);
    const assigned = taskRepository.findByAssignee(userId);
    return { created, assigned };
  } catch (error) {
    logger.error('Failed to get user tasks', error);
    throw error;
  }
}

export async function getTaskStats(guildId) {
  try {
    return taskRepository.getTaskStats(guildId);
  } catch (error) {
    logger.error('Failed to get task stats', error);
    throw error;
  }
}

export async function getOverdueTasks(guildId) {
  try {
    return taskRepository.getOverdueTasks(guildId);
  } catch (error) {
    logger.error('Failed to get overdue tasks', error);
    throw error;
  }
}

export function getPriorityInfo() {
  return Object.entries(PRIORITIES).map(([level, data]) => ({
    level,
    emoji: data.emoji,
    color: data.color
  }));
}

export default {
  createTask,
  completeTask,
  cancelTask,
  updateTask,
  getTasks,
  getUserTasks,
  getTaskStats,
  getOverdueTasks,
  getPriorityInfo,
  PRIORITIES
};