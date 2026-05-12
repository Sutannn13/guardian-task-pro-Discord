import { SlashCommandBuilder } from 'discord.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('penalty-reset')
    .setDescription('Reset penalty user ke 0 (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan di-reset')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('reset_sp')
        .setDescription('Apakah SP level juga di-reset?')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan reset')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Only admins can reset penalty
      if (!canWarn(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menggunakan perintah ini.')]
        });
      }

      // Check for admin permission
      const member = interaction.member;
      if (!member.permissions.has('Administrator')) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Hanya Admin yang bisa reset penalty.')]
        });
      }

      const targetUser = interaction.options.getUser('user');
      const resetSp = interaction.options.getBoolean('reset_sp') || false;
      const reason = interaction.options.getString('alasan') || 'Manual reset by admin';

      const result = await penaltyService.resetPenalty(
        targetUser.id,
        interaction.guildId,
        interaction.user.id,
        reason,
        resetSp
      );

      let message = `✅ Penalty di-reset untuk ${targetUser.username}.\n`;
      message += `Previous penalty: ${result.pointsBefore}\n`;
      if (resetSp) {
        message += `SP Level juga di-reset.`;
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed('Penalty Di-reset', message)]
      });
    } catch (error) {
      console.error('Penalty-reset command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal reset penalty.')]
      });
    }
  }
};