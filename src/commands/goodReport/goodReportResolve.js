import { SlashCommandBuilder } from 'discord.js';
import goodReportRepository from '../../database/repositories/goodReportRepository.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';
import config from '../../config/env.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('good-report-resolve')
    .setDescription('Setujui atau tolak laporan baik (Mod/Admin)')
    .addStringOption(option =>
      option.setName('report_id')
        .setDescription('Report ID yang akan diproses')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Status persetujuan')
        .setRequired(true)
        .setChoices(
          { name: '✅ Setujui', value: 'approved' },
          { name: '❌ Tolak', value: 'rejected' }
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

      const reportId = interaction.options.getString('report_id');
      const status = interaction.options.getString('status');

      // Find report
      const report = goodReportRepository.findByReportId(reportId);

      if (!report) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Not Found', `Report ID \`${reportId}\` tidak ditemukan.`)]
        });
      }

      if (report.status !== 'pending') {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Already Handled', `Report ini sudah diproses: ${report.status}`)]
        });
      }

      // Update status
      goodReportRepository.updateStatus(reportId, status, interaction.user.id);

      let message = '';

      if (status === 'approved') {
        // Reduce penalty points
        const targetUser = await interaction.guild.members.fetch(report.target_user_id);

        await penaltyService.reducePenalty({
          userId: report.target_user_id,
          username: targetUser?.user?.username || 'Unknown',
          guildId: report.guild_id,
          points: config.GOOD_REPORT_REDUCTION_POINTS,
          reason: `Good report approved: ${report.reason}`,
          actionType: 'GOOD_REPORT_APPROVED',
          moderatorId: interaction.user.id
        });

        message = `✅ Laporan baik \`${reportId}\` disetujui.\n`;
        message += `Penalty point targetuser dikurangi ${config.GOOD_REPORT_REDUCTION_POINTS} poin.\n\n`;
        message += `Reporter: <@${report.reporter_id}>\n`;
        message += `Target: <@${report.target_user_id}>`;
      } else {
        message = `❌ Laporan baik \`${reportId}\` ditolak.\n\n`;
        message += `Reporter: <@${report.reporter_id}>\n`;
        message += `Target: <@${report.target_user_id}>`;
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(status === 'approved' ? 'Disetujui' : 'Ditolak', message)]
      });
    } catch (error) {
      console.error('Good-report-resolve command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal memproses laporan.')]
      });
    }
  }
};