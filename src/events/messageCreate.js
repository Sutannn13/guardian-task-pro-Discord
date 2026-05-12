import { EmbedBuilder } from 'discord.js';
import config from '../config/env.js';
import penaltyService from '../services/penaltyService.js';
import badWordRepository from '../database/repositories/badWordRepository.js';
import logger from '../utils/logger.js';

/**
 * Normalize message content for bad word detection
 */
function normalizeMessage(content) {
  if (!content) return '';

  let normalized = content.toLowerCase();

  // Remove repeated spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Replace number patterns that might be used to evade detection
  normalized = normalized.replace(/4/g, 'a');
  normalized = normalized.replace(/1/g, 'i');
  normalized = normalized.replace(/0/g, 'o');
  normalized = normalized.replace(/3/g, 'e');

  // Remove basic punctuation but keep alphanumeric
  normalized = normalized.replace(/[^a-z0-9\s]/g, '');

  return normalized.trim();
}

/**
 * Check if content contains any bad words
 */
function containsBadWord(normalizedContent, badWords) {
  const detectedWords = [];

  for (const badWord of badWords) {
    // Create pattern that matches the word with optional characters in between
    const pattern = badWord.word.split('').join('[\\s_-]*');
    const regex = new RegExp(pattern, 'i');

    if (regex.test(normalizedContent)) {
      detectedWords.push(badWord.word);
    }
  }

  return detectedWords;
}

/**
 * Get the mod log channel and send an embed
 */
async function sendModLog(client, guild, embed) {
  if (!config.MOD_LOG_CHANNEL_ID) {
    logger.warn('MOD_LOG_CHANNEL_ID not configured');
    return;
  }

  try {
    const channel = guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error('Failed to send mod log:', error);
  }
}

/**
 * Create a mod log embed for auto moderation
 */
function createAutoModLogEmbed(user, detectedWords, points, totalPoints, threshold, action) {
  return new EmbedBuilder()
    .setTitle('🛡️ Auto Moderation Triggered')
    .setColor(0xFF6600)
    .addFields(
      { name: 'User', value: `<@${user.id}> (${user.username})`, inline: true },
      { name: 'Action', value: action, inline: true },
      { name: 'Penalty', value: `+${points}`, inline: true },
      { name: 'Current', value: `${totalPoints}/${threshold}`, inline: true }
    )
    .addFields(
      { name: 'Detected Words', value: detectedWords.length > 0 ? detectedWords.join(', ') : 'N/A', inline: false }
    )
    .setFooter({ text: 'GuardianTask Pro - Auto Moderation' })
    .setTimestamp();
}

export async function onMessageCreate(client, message) {
  try {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore DMs
    if (!message.guild) return;

    // Check if auto mod is enabled
    if (!config.AUTO_MOD_ENABLED) return;

    // Check if user has admin permission (bypass auto mod)
    const member = message.member;
    if (member && member.permissions.has('Administrator')) {
      return;
    }

    // Get bad words for this guild
    const badWords = badWordRepository.findByGuild(message.guild.id);

    // If no bad words configured, skip
    if (!badWords || badWords.length === 0) {
      return;
    }

    // Normalize message content
    const normalizedContent = normalizeMessage(message.content);

    // Check for bad words
    const detectedWords = containsBadWord(normalizedContent, badWords);

    if (detectedWords.length === 0) {
      return;
    }

    // Get points from the most severe detected word
    const severities = { low: 1, medium: 3, high: 5 };
    let points = config.BAD_WORD_DEFAULT_POINTS;

    for (const word of badWords) {
      if (detectedWords.includes(word.word)) {
        const wordPoints = word.points || severities[word.severity] || 3;
        points = Math.max(points, wordPoints);
      }
    }

    // Delete message if configured
    if (config.AUTO_DELETE_BAD_WORD_MESSAGE) {
      try {
        if (message.deletable) {
          await message.delete();
          logger.debug(`Deleted message from ${message.author.username} containing bad words`);
        }
      } catch (deleteError) {
        logger.warn('Failed to delete bad word message:', deleteError);
      }
    }

    // Add penalty
    const result = await penaltyService.addPenalty({
      userId: message.author.id,
      username: message.author.username,
      guildId: message.guild.id,
      points,
      reason: `Auto-detected bad word(s): ${detectedWords.join(', ')}`,
      actionType: 'BAD_WORD',
      evidence: message.content.slice(0, 500)
    });

    // Send mod log
    const embed = createAutoModLogEmbed(
      message.author,
      detectedWords.map(w => censorWord(w)),
      points,
      result.pointsAfter,
      result.currentThreshold,
      result.sanctionTriggered ? result.sanctionType : 'BAD_WORD_DETECTED'
    );

    await sendModLog(client, message.guild, embed);

    // Handle SP or kick
    if (result.sanctionTriggered && result.sanctionType === 'SP1') {
      await handleSpIssued(client, message.guild, message.author, 1);
    } else if (result.sanctionTriggered && result.sanctionType === 'SP2') {
      await handleSpIssued(client, message.guild, message.author, 2);
    } else if (result.sanctionTriggered && result.sanctionType === 'AUTO_KICK') {
      await handleAutoKick(message.guild, message.author, message.member);
    } else if (result.sanctionTriggered && result.sanctionType === 'KICK_RECOMMENDED') {
      await handleKickRecommended(client, message.guild, message.author, message.member);
    }

    logger.info(`Auto mod triggered for ${message.author.username}: +${points} points, total: ${result.pointsAfter}`);
  } catch (error) {
    logger.error('Error in messageCreate event:', error);
  }
}

/**
 * Handle SP being issued
 */
async function handleSpIssued(client, guild, user, spLevel) {
  try {
    // Send DM to user
    const dmEmbed = new EmbedBuilder()
      .setTitle(spLevel === 1 ? '⚠️ Surat Peringatan 1 (SP1)' : '⚠️ Surat Peringatan 2 (SP2)')
      .setColor(0xFF0000)
      .setDescription(`Anda telah menerima ${spLevel === 1 ? 'SP1' : 'SP2'} karena mencapai batas penalty point.\n\nPenalty point Anda telah di-reset ke 0.\nJika Anda mencapai batas lagi, tindakan lebih lanjut akan diambil.`)
      .setFooter({ text: 'GuardianTask Pro' })
      .setTimestamp();

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      logger.warn(`Could not send DM to user ${user.username}`);
    }

    // Log to mod channel
    if (config.MOD_LOG_CHANNEL_ID) {
      const channel = guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        const spEmbed = new EmbedBuilder()
          .setTitle(spLevel === 1 ? '📋 SP1 Issued' : '📋 SP2 Issued')
          .setColor(0xFF0000)
          .addFields(
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'SP Level', value: String(spLevel), inline: true }
          )
          .setDescription(`User telah menerima ${spLevel === 1 ? 'Surat Peringatan 1' : 'Surat Peringatan 2'}.`)
          .setFooter({ text: 'GuardianTask Pro - Auto Moderation' });

        await channel.send({ embeds: [spEmbed] });
      }
    }
  } catch (error) {
    logger.error('Error handling SP issued:', error);
  }
}

/**
 * Handle auto kick
 */
async function handleAutoKick(guild, user, member) {
  try {
    // Send DM before kick
    const kickEmbed = new EmbedBuilder()
      .setTitle('🚫 Anda telah di-kick dari server')
      .setColor(0xFF0000)
      .setDescription('Anda telah di-kick secara otomatis karena mencapai batas SP2 dan terus melanggar.')
      .setFooter({ text: 'GuardianTask Pro' });

    try {
      await user.send({ embeds: [kickEmbed] });
    } catch (dmError) {
      // Ignore DM failure
    }

    // Kick the member
    if (member && member.kickable) {
      await member.kick('Auto kick: SP2 threshold reached');
      logger.info(`Auto kicked user ${user.username} from ${guild.name}`);
    }

    // Log to mod channel
    if (config.MOD_LOG_CHANNEL_ID) {
      const channel = guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        const kickLogEmbed = new EmbedBuilder()
          .setTitle('🚫 AUTO KICK Executed')
          .setColor(0xFF0000)
          .addFields(
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'Username', value: user.username, inline: true }
          )
          .setDescription('User telah di-kick otomatis karena mencapai batas SP2.')
          .setFooter({ text: 'GuardianTask Pro - Auto Moderation' });

        await channel.send({ embeds: [kickLogEmbed] });
      }
    }
  } catch (error) {
    logger.error('Error handling auto kick:', error);
  }
}

/**
 * Handle kick recommendation
 */
async function handleKickRecommended(client, guild, user, member) {
  try {
    // Log recommendation to mod channel
    if (config.MOD_LOG_CHANNEL_ID) {
      const channel = guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
      if (channel && channel.isTextBased()) {
        const recommendEmbed = new EmbedBuilder()
          .setTitle('⚠️ KICK RECOMMENDED')
          .setColor(0xFFAA00)
          .addFields(
            { name: 'User', value: `<@${user.id}> (${user.username})`, inline: true },
            { name: 'ID', value: user.id, inline: true }
          )
          .setDescription('User telah mencapai batas SP2.\n\n**Recommended Action:** Kick user dari server.\n\nSet `AUTO_KICK_ENABLED=true` di .env untuk auto kick.')
          .setFooter({ text: 'GuardianTask Pro - Auto Moderation' });

        await channel.send({ embeds: [recommendEmbed] });
      }
    }
  } catch (error) {
    logger.error('Error handling kick recommendation:', error);
  }
}

/**
 * Censor a word (show only first and last character)
 */
function censorWord(word) {
  if (word.length <= 2) {
    return '*'.repeat(word.length);
  }
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

export default onMessageCreate;