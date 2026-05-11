import { SlashCommandBuilder } from 'discord.js';
import dashboardService from '../../services/dashboardService.js';
import { createDashboardEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Tampilkan statistik server dan summary'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const guild = interaction.guild;
      if (!guild) {
        return await interaction.editReply({ content: 'Perintah ini hanya bisa digunakan di server.' });
      }

      const dashboard = await dashboardService.getFullDashboard(guild);

      const embed = createDashboardEmbed();

      // Server Info
      embed.addFields(
        { name: '📌 Server', value: dashboard.server.serverName, inline: false }
      );

      if (dashboard.server.serverIcon) {
        embed.setThumbnail(dashboard.server.serverIcon);
      }

      embed.addFields(
        { name: '👥 Total Member', value: String(dashboard.server.totalMembers), inline: true },
        { name: '🟢 Online', value: String(dashboard.server.onlineMembers), inline: true },
        { name: '📁 Channel', value: String(dashboard.server.totalChannels), inline: true }
      );

      // Moderation Stats
      embed.addFields(
        { name: '🛡️ Moderasi', value: '​', inline: false },
        { name: 'Total Peringatan', value: String(dashboard.moderation.totalWarnings), inline: true },
        { name: 'Minggu Ini', value: String(dashboard.moderation.weeklyWarnings), inline: true }
      );

      const severityLines = Object.entries(dashboard.moderation.severityCounts)
        .map(([level, count]) => `${level}: ${count}`)
        .join(', ');
      embed.addFields({ name: 'Tingkat', value: severityLines, inline: false });

      // Task Stats
      embed.addFields(
        { name: '📋 Tugas', value: '​', inline: false },
        { name: 'Total', value: String(dashboard.tasks.total || 0), inline: true },
        { name: 'Pending', value: String(dashboard.tasks.pending || 0), inline: true },
        { name: 'Selesai', value: String(dashboard.tasks.completed || 0), inline: true }
      );

      if (dashboard.tasks.overdueCount > 0) {
        embed.addFields({ name: '⚠️ Terlambat', value: String(dashboard.tasks.overdueCount), inline: true });
      }

      // Report Stats
      embed.addFields(
        { name: '🚨 Laporan', value: '​', inline: false },
        { name: 'Total', value: String(dashboard.reports.total || 0), inline: true },
        { name: 'Pending', value: String(dashboard.reports.pending || 0), inline: true },
        { name: 'Terselesaikan', value: String(dashboard.reports.resolved || 0), inline: true }
      );

      // Top Users
      if (dashboard.topUsers.length > 0) {
        const topList = dashboard.topUsers
          .slice(0, 5)
          .map((u, i) => `${i + 1}. ${u.username || 'Unknown'} - ${u.total_points} poin`)
          .join('\n');
        embed.addFields({ name: '🏆 Top Users', value: topList, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Dashboard error:', error);
      await interaction.editReply({ content: 'Gagal menampilkan dashboard.' });
    }
  }
};