import { SlashCommandBuilder } from 'discord.js';
import dashboardService from '../../services/dashboardService.js';
import config from '../../config/env.js';
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
      const modStats = dashboard.moderation || {};
      const severityCounts = modStats.severityCounts || { ringan: 0, sedang: 0, berat: 0 };

      embed.addFields(
        { name: '🛡️ Moderasi', value: '​', inline: false },
        { name: 'Total Peringatan', value: String(modStats.totalWarnings || 0), inline: true },
        { name: 'Minggu Ini', value: String(modStats.weeklyWarnings || 0), inline: true }
      );

      const severityLines = Object.entries(severityCounts)
        .map(([level, count]) => `${level}: ${count}`)
        .join(', ');
      embed.addFields({ name: 'Tingkat', value: severityLines, inline: false });

      // Penalty System Stats
      const penaltyStats = dashboard.penalty || {};
      const goodReportStats = dashboard.goodReports || {};

      embed.addFields(
        { name: '⚖️ Penalty System', value: '​', inline: false },
        { name: 'User dengan Penalty', value: String(penaltyStats.users_with_penalty || 0), inline: true },
        { name: 'SP1 Aktif', value: String(penaltyStats.sp1_count || 0), inline: true },
        { name: 'SP2 Aktif', value: String(penaltyStats.sp2_count || 0), inline: true },
        { name: 'AutoMod Triggers', value: String(penaltyStats.auto_mod_triggers || 0), inline: true },
        { name: 'Good Report Pending', value: String(goodReportStats.pending || 0), inline: true }
      );

      // AutoMod Status
      const autoModStatus = config.AUTO_MOD_ENABLED ? '🟢 ON' : '🔴 OFF';
      embed.addFields(
        { name: 'AutoMod', value: autoModStatus, inline: true }
      );

      // Task Stats
      const taskStats = dashboard.tasks || {};
      embed.addFields(
        { name: '📋 Tugas', value: '​', inline: false },
        { name: 'Total', value: String(taskStats.total || 0), inline: true },
        { name: 'Pending', value: String(taskStats.pending || 0), inline: true },
        { name: 'Selesai', value: String(taskStats.completed || 0), inline: true }
      );

      if ((taskStats.overdueCount || 0) > 0) {
        embed.addFields({ name: '⚠️ Terlambat', value: String(taskStats.overdueCount), inline: true });
      }

      // Report Stats
      const reportStats = dashboard.reports || {};
      embed.addFields(
        { name: '🚨 Laporan', value: '​', inline: false },
        { name: 'Total', value: String(reportStats.total || 0), inline: true },
        { name: 'Pending', value: String(reportStats.pending || 0), inline: true },
        { name: 'Terselesaikan', value: String(reportStats.resolved || 0), inline: true }
      );

      // Top Users
      const topUsers = dashboard.topUsers || [];
      if (topUsers.length > 0) {
        const topList = topUsers
          .slice(0, 5)
          .map((u, i) => `${i + 1}. ${u.username || 'Unknown'} - ${u.total_points || 0} poin`)
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