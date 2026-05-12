import { SlashCommandBuilder } from 'discord.js';
import { canWarn } from '../../utils/permissionUtils.js';
import moderationService from '../../services/moderationService.js';
import penaltyService from '../../services/penaltyService.js';
import { createModerationEmbed, createErrorEmbed, createSuccessEmbed } from '../../utils/embedUtils.js';
import { formatDate } from '../../utils/dateUtils.js';

// Penalty points mapping for warn severity
const PENALTY_POINTS = {
  ringan: 1,
  sedang: 3,
  berat: 5
};

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Berikan peringatan ke pengguna')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Pengguna yang akan diperingatkan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan pemberian peringatan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tingkat')
        .setDescription('Tingkat keparahan peringatan')
        .setChoices(
          { name: 'Ringan (1 poin)', value: 'ringan' },
          { name: 'Sedang (3 poin)', value: 'sedang' },
          { name: 'Berat (5 poin)', value: 'berat' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!canWarn(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menggunakan perintah ini.')]
        });
      }

      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('alasan');
      const severity = interaction.options.getString('tingkat') || 'sedang';

      if (targetUser.bot) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid Target', 'Tidak bisa memberikan peringatan ke bot.')]
        });
      }

      if (targetUser.id === interaction.user.id) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid Target', 'Tidak bisa memberikan peringatan ke diri sendiri.')]
        });
      }

      // Create warning
      const result = await moderationService.createWarning(
        targetUser.id,
        targetUser.username,
        interaction.user.id,
        interaction.guildId,
        reason,
        severity
      );

      // Add penalty points
      const penaltyPoints = PENALTY_POINTS[severity] || 3;
      const penaltyResult = await penaltyService.addPenalty({
        userId: targetUser.id,
        username: targetUser.username,
        guildId: interaction.guildId,
        points: penaltyPoints,
        reason: `Warning: ${reason}`,
        actionType: 'MANUAL_WARN',
        moderatorId: interaction.user.id
      });

      const embed = createModerationEmbed()
        .setTitle('✅ Peringatan Dibuat')
        .addFields(
          { name: '📋 Case ID', value: result.caseId, inline: true },
          { name: '👤 Target', value: targetUser.username, inline: true },
          { name: '⚖️ Tingkat', value: severity.toUpperCase(), inline: true },
          { name: '📝 Alasan', value: reason, inline: false }
        )
        .addFields(
          { name: '📊 Total Peringatan', value: String(result.totalWarnings), inline: true },
          { name: '🎯 Total Poin', value: String(result.totalPoints), inline: true }
        )
        .addFields(
          { name: '⚖️ Penalty Points', value: `+${penaltyPoints} (Total: ${penaltyResult.pointsAfter}/${penaltyResult.currentThreshold})`, inline: false }
        );

      // Show SP warning if triggered
      if (penaltyResult.sanctionTriggered) {
        embed.addFields({
          name: '⚠️ SANCTION',
          value: `${penaltyResult.sanctionType} triggered!`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

      // Send DM to user
      try {
        const dmEmbed = createModerationEmbed()
          .setTitle('⚠️ Anda Mendapat Peringatan')
          .addFields(
            { name: '📋 Server', value: interaction.guild.name, inline: true },
            { name: '📋 Case ID', value: result.caseId, inline: true },
            { name: '⚖️ Tingkat', value: severity.toUpperCase(), inline: true }
          )
          .addFields(
            { name: '📝 Alasan', value: reason, inline: false },
            { name: '👮 Oleh', value: interaction.user.username, inline: true },
            { name: '📅 Waktu', value: formatDate(new Date()), inline: false }
          )
          .addFields(
            { name: '⚖️ Penalty Point', value: `+${penaltyPoints}`, inline: true }
          );

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        // Silently fail if DM can't be sent
        console.log('Could not send DM to user');
      }
    } catch (error) {
      console.error('Warn command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal membuat peringatan.')]
      });
    }
  }
};