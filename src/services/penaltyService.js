import penaltyRepository from '../database/repositories/penaltyRepository.js';
import userRepository from '../database/repositories/userRepository.js';
import auditLogService from './auditLogService.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const SEVERITY_POINTS = {
  ringan: 1,
  sedang: 3,
  berat: 5
};

/**
 * Ensure user exists in database
 */
export async function ensureUser(userId, username, guildId) {
  userRepository.create(userId, username, guildId);
}

/**
 * Add penalty points to a user
 */
export async function addPenalty({ userId, username, guildId, points, reason, actionType, evidence = null, moderatorId = null }) {
  try {
    // Ensure user exists
    await ensureUser(userId, username, guildId);

    // Get current penalty state
    const user = penaltyRepository.getUserPenalty(userId, guildId);
    const pointsBefore = user?.penalty_points || 0;
    const spLevelBefore = user?.sp_level || 0;

    // Add points
    const pointsAfter = Math.max(0, pointsBefore + points);

    // Update user penalty
    penaltyRepository.updateUserPenalty(userId, guildId, pointsAfter, spLevelBefore);
    penaltyRepository.updateLastViolation(userId, guildId);

    // Create penalty log
    penaltyRepository.createPenaltyLog(
      userId,
      username,
      guildId,
      actionType,
      points,
      pointsBefore,
      pointsAfter,
      spLevelBefore,
      spLevelBefore,
      reason,
      evidence,
      moderatorId
    );

    // Log audit
    await auditLogService.logAction(
      'PENALTY_ADDED',
      moderatorId,
      userId,
      guildId,
      { points, actionType, pointsAfter }
    );

    logger.info(`Penalty added: ${points} points to user ${userId}, total: ${pointsAfter}`);

    // Check if threshold is reached
    const result = await handleThreshold({
      penalty_points: pointsAfter,
      sp_level: spLevelBefore
    }, guildId, userId, username, moderatorId);

    return {
      success: true,
      pointsBefore,
      pointsAfter,
      spLevelBefore,
      spLevelAfter: result.spLevelAfter || spLevelBefore,
      sanctionTriggered: result.sanctionTriggered,
      sanctionType: result.sanctionType,
      currentThreshold: getThreshold(spLevelBefore)
    };
  } catch (error) {
    logger.error('Failed to add penalty', error);
    throw error;
  }
}

/**
 * Reduce penalty points from a user
 */
export async function reducePenalty({ userId, username, guildId, points, reason, actionType, moderatorId = null }) {
  try {
    const user = penaltyRepository.getUserPenalty(userId, guildId);
    if (!user) {
      throw new Error('User not found');
    }

    const pointsBefore = user.penalty_points;
    const pointsAfter = Math.max(0, pointsBefore - points);
    const spLevel = user.sp_level;

    penaltyRepository.updateUserPenalty(userId, guildId, pointsAfter, spLevel);

    penaltyRepository.createPenaltyLog(
      userId,
      username,
      guildId,
      actionType,
      -points,
      pointsBefore,
      pointsAfter,
      spLevel,
      spLevel,
      reason,
      null,
      moderatorId
    );

    await auditLogService.logAction(
      'PENALTY_REDUCED',
      moderatorId,
      userId,
      guildId,
      { points, actionType, pointsAfter }
    );

    logger.info(`Penalty reduced: ${points} points from user ${userId}, total: ${pointsAfter}`);

    return {
      success: true,
      pointsBefore,
      pointsAfter,
      spLevel
    };
  } catch (error) {
    logger.error('Failed to reduce penalty', error);
    throw error;
  }
}

/**
 * Handle penalty threshold - issue SP or recommend kick
 */
async function handleThreshold(userData, guildId, userId, username, moderatorId) {
  const spLevel = userData.sp_level || 0;
  const penaltyPoints = userData.penalty_points || 0;
  const threshold = getThreshold(spLevel);

  // Check if threshold reached
  if (penaltyPoints < threshold) {
    return { spLevelAfter: spLevel, sanctionTriggered: false };
  }

  let newSpLevel = spLevel;
  let sanctionTriggered = false;
  let sanctionType = null;

  if (spLevel === 0 && penaltyPoints >= config.PENALTY_NORMAL_THRESHOLD) {
    // Issue SP1
    newSpLevel = 1;
    sanctionTriggered = true;
    sanctionType = 'SP1';
  } else if (spLevel === 1 && penaltyPoints >= config.PENALTY_SP_THRESHOLD) {
    // Issue SP2
    newSpLevel = 2;
    sanctionTriggered = true;
    sanctionType = 'SP2';
  } else if (spLevel >= 2 && penaltyPoints >= config.PENALTY_SP_THRESHOLD) {
    // Final sanction
    sanctionTriggered = true;
    sanctionType = config.AUTO_KICK_ENABLED ? 'AUTO_KICK' : 'KICK_RECOMMENDED';
  }

  // Update sp level and reset points
  penaltyRepository.updateUserPenalty(userId, guildId, 0, newSpLevel);

  // Log the sanction
  penaltyRepository.createPenaltyLog(
    userId,
    username,
    guildId,
    sanctionType,
    0,
    penaltyPoints,
    0,
    spLevel,
    newSpLevel,
    `Threshold reached: ${penaltyPoints}/${getThreshold(spLevel)}`,
    null,
    moderatorId
  );

  await auditLogService.logAction(
    sanctionType === 'AUTO_KICK' ? 'USER_AUTO_KICKED' : 'SP_ISSUED',
    moderatorId,
    userId,
    guildId,
    { sanctionType, previousSpLevel: spLevel, newSpLevel }
  );

  logger.info(`Sanction triggered: ${sanctionType} for user ${userId}`);

  return { spLevelAfter: newSpLevel, sanctionTriggered, sanctionType };
}

/**
 * Get current threshold based on SP level
 */
function getThreshold(spLevel) {
  if (spLevel === 0) {
    return config.PENALTY_NORMAL_THRESHOLD;
  }
  return config.PENALTY_SP_THRESHOLD;
}

/**
 * Decay penalty points for users who haven't violated in a while
 */
export async function decayPenaltyForGuild(guildId) {
  try {
    const users = penaltyRepository.getUsersForDecay(guildId, config.PENALTY_DECAY_HOURS);
    let decayedCount = 0;

    for (const user of users) {
      if (user.penalty_points > 0) {
        const pointsBefore = user.penalty_points;
        const pointsAfter = Math.max(0, user.penalty_points - config.PENALTY_DECAY_POINTS);

        if (pointsAfter < pointsBefore) {
          penaltyRepository.updateUserPenalty(user.user_id, guildId, pointsAfter, user.sp_level);
          penaltyRepository.updateLastDecay(user.user_id, guildId);

          penaltyRepository.createPenaltyLog(
            user.user_id,
            user.username,
            guildId,
            'DECAY',
            -config.PENALTY_DECAY_POINTS,
            pointsBefore,
            pointsAfter,
            user.sp_level,
            user.sp_level,
            `Auto decay after ${config.PENALTY_DECAY_HOURS} hours without violation`
          );

          decayedCount++;
          logger.debug(`Decayed ${config.PENALTY_DECAY_POINTS} points for user ${user.user_id}`);
        }
      }
    }

    if (decayedCount > 0) {
      logger.info(`Decay completed: ${decayedCount} users updated in guild ${guildId}`);
    }

    return decayedCount;
  } catch (error) {
    logger.error('Failed to decay penalty for guild', error);
    return 0;
  }
}

/**
 * Get penalty status for a user
 */
export async function getPenaltyStatus(userId, guildId) {
  try {
    const user = penaltyRepository.getUserPenalty(userId, guildId);
    if (!user) {
      return {
        penalty_points: 0,
        sp_level: 0,
        threshold: config.PENALTY_NORMAL_THRESHOLD,
        progress: 0,
        status: 'aman',
        recentLogs: []
      };
    }

    const threshold = getThreshold(user.sp_level);
    const progress = Math.min(100, Math.round((user.penalty_points / threshold) * 100));

    let status = 'aman';
    if (user.penalty_points >= threshold) {
      status = 'final_warning';
    } else if (progress >= 80) {
      status = 'hampir_sp';
    } else if (progress >= 50) {
      status = 'perlu_diawasi';
    }

    const recentLogs = penaltyRepository.findPenaltyLogsByUser(userId, guildId, 5);

    return {
      penalty_points: user.penalty_points,
      sp_level: user.sp_level,
      threshold,
      progress,
      status,
      recentLogs
    };
  } catch (error) {
    logger.error('Failed to get penalty status', error);
    throw error;
  }
}

/**
 * Reset penalty for a user
 */
export async function resetPenalty(userId, guildId, moderatorId, reason, resetSpLevel = false) {
  try {
    const user = penaltyRepository.getUserPenalty(userId, guildId);
    if (!user) {
      throw new Error('User not found');
    }

    const pointsBefore = user.penalty_points;
    const spLevelBefore = user.sp_level;

    penaltyRepository.resetPenalty(userId, guildId, resetSpLevel);

    const newSpLevel = resetSpLevel ? 0 : user.sp_level;

    penaltyRepository.createPenaltyLog(
      userId,
      user.username,
      guildId,
      'RESET',
      -pointsBefore,
      pointsBefore,
      0,
      spLevelBefore,
      newSpLevel,
      reason || 'Manual reset by moderator'
    );

    await auditLogService.logAction(
      'PENALTY_RESET',
      moderatorId,
      userId,
      guildId,
      { pointsBefore, resetSpLevel }
    );

    logger.info(`Penalty reset for user ${userId}, resetSpLevel: ${resetSpLevel}`);

    return {
      success: true,
      pointsBefore,
      spLevelBefore,
      newSpLevel
    };
  } catch (error) {
    logger.error('Failed to reset penalty', error);
    throw error;
  }
}

/**
 * Get penalty statistics for a guild
 */
export async function getPenaltyStats(guildId) {
  try {
    return penaltyRepository.getPenaltyStats(guildId);
  } catch (error) {
    logger.error('Failed to get penalty stats', error);
    return {
      users_with_penalty: 0,
      sp1_count: 0,
      sp2_count: 0,
      auto_mod_triggers: 0
    };
  }
}

export default {
  ensureUser,
  addPenalty,
  reducePenalty,
  decayPenaltyForGuild,
  getPenaltyStatus,
  resetPenalty,
  getPenaltyStats
};