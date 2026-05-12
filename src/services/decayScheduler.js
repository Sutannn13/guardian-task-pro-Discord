import cron from 'node-cron';
import penaltyService from './penaltyService.js';
import logger from '../utils/logger.js';

let decayJob = null;

/**
 * Start the penalty decay scheduler
 * Runs every 30 minutes
 */
export function startDecayScheduler(client) {
  if (decayJob) {
    logger.warn('Decay scheduler already running');
    return;
  }

  // Run every 30 minutes
  decayJob = cron.schedule('*/30 * * * *', async () => {
    logger.debug('Running penalty decay job...');

    try {
      for (const guild of client.guilds.cache.values()) {
        try {
          const decayed = await penaltyService.decayPenaltyForGuild(guild.id);
          if (decayed > 0) {
            logger.info(`Guild ${guild.name}: ${decayed} users decayed`);
          }
        } catch (guildError) {
          logger.error(`Failed to decay penalties for guild ${guild.name}:`, guildError);
        }
      }
    } catch (error) {
      logger.error('Error in decay scheduler:', error);
    }
  });

  logger.info('Penalty decay scheduler started (runs every 30 minutes)');
}

/**
 * Stop the decay scheduler
 */
export function stopDecayScheduler() {
  if (decayJob) {
    decayJob.stop();
    decayJob = null;
    logger.info('Penalty decay scheduler stopped');
  }
}

export default {
  startDecayScheduler,
  stopDecayScheduler
};