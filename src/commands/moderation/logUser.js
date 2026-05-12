import { SlashCommandBuilder } from 'discord.js';
import { canWarn } from '../../utils/permissionUtils.js';
import warningRepository from '../../database/repositories/warningRepository.js';
import taskRepository from '../../database/repositories/taskRepository.js';
import reportRepository from '../../database/repositories/reportRepository.js';
import { createModerationEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embedUtils.js';
import { formatDate, parseRelativeTime } from '../../utils/dateUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('log-user')
    .setDescription('Lihat riwayat dan statistik pengguna')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Pengguna yang akan dicek')
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

      // Get warnings
      const warnings = warningRepository.findByUserId(targetUser.id);
      const warningStats = warningRepository.getUserWarningCount(targetUser.id);

      // Get tasks
      const createdTasks = taskRepository.findByCreator(targetUser.id);
      const assignedTasks = taskRepository.findByAssignee(targetUser.id);
      const completedTasks = createdTasks.filter(t => t.status === 'completed').length +
        assignedTasks.filter(t => t.status === 'completed').length;

      // Get reports
      const reports = reportRepository.findByReportedUser(targetUser.id);

      const embed = createInfoEmbed(`📋 Riwayat: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '👤 User ID', value: targetUser.id, inline: false }
        );

      // Warnings section
      const totalWarnings = warningStats.count || 0;
      const totalPoints = warningStats.total_points || 0;

      embed.addFields(
        { name: '⚠️ Peringatan', value: '​', inline: false },
        { name: 'Total', value: String(totalWarnings), inline: true },
        { name: 'Total Poin', value: String(totalPoints), inline: true }
      );

      if (warnings.length > 0) {
        const recentWarnings = warnings.slice(0, 5);
        const warningList = recentWarnings
          .map(w => `\`${w.case_id}\` - ${w.severity} (${w.points}pt) - ${parseRelativeTime(w.created_at)}`)
          .join('\n');
        embed.addFields({ name: '🔹 Recent', value: warningList, inline: false });
      }

      // Tasks section
      const pendingTasks = assignedTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

      embed.addFields(
        { name: '📋 Tugas', value: '​', inline: false },
        { name: 'Dibuat', value: String(createdTasks.length), inline: true },
        { name: 'Ditugaskan', value: String(assignedTasks.length), inline: true },
        { name: 'Selesai', value: String(completedTasks), inline: true },
        { name: 'Pending', value: String(pendingTasks), inline: true }
      );

      // Reports section
      const pendingReports = reports.filter(r => r.status === 'pending').length;

      embed.addFields(
        { name: '🚨 Laporan', value: '​', inline: false },
        { name: 'Total Laporan', value: String(reports.length), inline: true },
        { name: 'Pending', value: String(pendingReports), inline: true }
      );

      if (reports.length > 0) {
        const recentReports = reports.slice(0, 3);
        const reportList = recentReports
          .map(r => `\`${r.report_id}\` - ${r.status} - ${parseRelativeTime(r.created_at)}`)
          .join('\n');
        embed.addFields({ name: '🔹 Recent', value: reportList, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Log user command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengambil data pengguna.')]
      });
    }
  }
};