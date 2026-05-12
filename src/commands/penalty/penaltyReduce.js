import { SlashCommandBuilder } from 'discord.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('penalty-reduce')
    .setDescription('Kurangi penalty secara manual (Moderator+)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan dikurangi penalty')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('points')
        .setDescription('Jumlah pengurangan penalty')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan pengurangan penalty')
        .setRequired(true)
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
      const points = interaction.options.getInteger('points');
      const reason = interaction.options.getString('alasan');

      if (points < 1 || points > 10) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid Points', 'Points harus antara 1 dan 10.')]
        });
      }

      const result = await penaltyService.reducePenalty({
        userId: targetUser.id,
        username: targetUser.username,
        guildId: interaction.guildId,
        points,
        reason,
        actionType: 'MANUAL_REDUCTION',
        moderatorId: interaction.user.id
      });

      const message = `✅ Penalty dikurangi ${points} untuk ${targetUser.username}.\nTotal penalty: ${result.pointsAfter}`;

      await interaction.editReply({
        embeds: [createSuccessEmbed('Penalty Dikurangi', message)]
      });
    } catch (error) {
      console.error('Penalty-reduce command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengurangi penalty.')]
      });
    }
  }
};