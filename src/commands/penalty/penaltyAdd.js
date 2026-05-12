import { SlashCommandBuilder } from 'discord.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('penalty-add')
    .setDescription('Tambah penalty secara manual (Moderator+)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan ditambahkan penalty')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('points')
        .setDescription('Jumlah penalty points')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan penambahan penalty')
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

      if (points < 1 || points > 20) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid Points', 'Points harus antara 1 dan 20.')]
        });
      }

      const result = await penaltyService.addPenalty({
        userId: targetUser.id,
        username: targetUser.username,
        guildId: interaction.guildId,
        points,
        reason,
        actionType: 'MANUAL_WARN',
        moderatorId: interaction.user.id
      });

      let message = `✅ Penalty +${points} ditambahkan ke ${targetUser.username}.\n`;
      message += `Total penalty: ${result.pointsAfter}/${result.currentThreshold}`;

      if (result.sanctionTriggered) {
        message += `\n\n⚠️ **${result.sanctionType}** triggered!`;
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed('Penalty Ditambahkan', message)]
      });
    } catch (error) {
      console.error('Penalty-add command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menambahkan penalty.')]
      });
    }
  }
};