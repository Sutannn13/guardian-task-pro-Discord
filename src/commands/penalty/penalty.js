import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('penalty')
    .setDescription('Melihat penalty status user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan dicek')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');

      const status = await penaltyService.getPenaltyStatus(targetUser.id, interaction.guildId);

      // Create progress bar
      const progressBars = 10;
      const filledBars = Math.round((status.progress / 100) * progressBars);
      const emptyBars = progressBars - filledBars;
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      // Status text
      const statusText = {
        aman: '🟢 Aman',
        perlu_diawasi: '🟡 Perlu Diawasi',
        hampir_sp: '🟠 Hampir SP',
        final_warning: '🔴 Final Warning'
      };

      // SP level text
      const spLevelText = status.sp_level === 0 ? 'Normal' :
        status.sp_level === 1 ? 'SP1' :
          status.sp_level === 2 ? 'SP2' : 'Final';

      const embed = new EmbedBuilder()
        .setTitle(`⚖️ Penalty Status: ${targetUser.username}`)
        .setColor(0x0099FF)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'Penalty Points', value: `${status.penalty_points}/${status.threshold}`, inline: true },
          { name: 'SP Level', value: spLevelText, inline: true },
          { name: 'Status', value: statusText[status.status] || 'Unknown', inline: true }
        )
        .addFields(
          { name: 'Progress', value: `\`${progressBar}\` ${status.progress}%`, inline: false }
        );

      // Add recommendation
      let recommendation = '';
      if (status.progress >= 100) {
        recommendation = '⚠️ User sudah达到 batas! SP akan diberikan.';
      } else if (status.progress >= 80) {
        recommendation = '⚠️ Hati-hati! User hampir达到 batas SP.';
      } else if (status.progress >= 50) {
        recommendation = '👁️ User perlu diawasi.';
      } else {
        recommendation = '✅ User dalam kondisi aman.';
      }
      embed.addFields({ name: 'Rekomendasi', value: recommendation, inline: false });

      // Add recent penalty logs
      if (status.recentLogs && status.recentLogs.length > 0) {
        const logText = status.recentLogs
          .map(log => {
            const actionIcon = {
              'BAD_WORD': '🛡️',
              'MANUAL_WARN': '⚠️',
              'SP1': '📋',
              'SP2': '📋',
              'DECAY': '⏰',
              'GOOD_REPORT_APPROVED': '⭐',
              'RESET': '🔄'
            }[log.action_type] || '•';
            return `${actionIcon} \`${log.action_type}\` +${log.points_change} pts (${log.points_after} now)`;
          })
          .join('\n');
        embed.addFields({ name: '📜 Recent Activity', value: logText, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Penalty command error:', error);
      await interaction.editReply({ content: 'Gagal mengambil penalty status.' });
    }
  }
};