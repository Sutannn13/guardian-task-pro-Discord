import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import goodReportRepository from '../../database/repositories/goodReportRepository.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('good-report-list')
    .setDescription('Lihat laporan baik yang pending (Mod/Admin)'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!canWarn(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menggunakan perintah ini.')]
        });
      }

      const reports = goodReportRepository.findPending(interaction.guildId);

      if (reports.length === 0) {
        return await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('📋 Laporan Baik Pending')
            .setDescription('Tidak ada laporan baik yang pending.')
            .setColor(0x0099FF)
          ]
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`📋 Laporan Baik Pending (${reports.length})`)
        .setColor(0x0099FF)
        .setFooter({ text: 'GuardianTask Pro' });

      // Get user details for display
      const guild = interaction.guild;
      const reportList = reports.map(r => {
        const reporter = guild.members.cache.get(r.reporter_id);
        const target = guild.members.cache.get(r.target_user_id);

        return {
          id: r.report_id,
          reporter: reporter?.user?.username || r.reporter_id,
          target: target?.user?.username || r.target_user_id,
          reason: r.reason,
          createdAt: new Date(r.created_at).toLocaleString('id-ID')
        };
      });

      // Show first 10 reports
      const displayReports = reportList.slice(0, 10);

      for (const r of displayReports) {
        embed.addFields({
          name: `📝 ${r.id}`,
          value: `Reporter: <@${r.reporter_id}>\nTarget: <@${r.target_user_id}>\nAlasan: ${r.reason.slice(0, 100)}${r.reason.length > 100 ? '...' : ''}\nWaktu: ${r.createdAt}`,
          inline: false
        });
      }

      if (reports.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${reports.length}. Use /good-report-resolve to handle.` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Good-report-list command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengambil daftar laporan.')]
      });
    }
  }
};