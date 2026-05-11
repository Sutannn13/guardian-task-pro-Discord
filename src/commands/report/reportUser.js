import { SlashCommandBuilder } from 'discord.js';
import reportService from '../../services/reportService.js';
import { createReportEmbed, createErrorEmbed, createSuccessEmbed } from '../../utils/embedUtils.js';
import config from '../../config/env.js';

export default {
  data: new SlashCommandBuilder()
    .setName('report-user')
    .setDescription('Laporkan pengguna yang bermasalah')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Pengguna yang dilaporkan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan laporan')
        .setRequired(true)
        .setMaxLength(1000)
    )
    .addStringOption(option =>
      option.setName('bukti')
        .setDescription('Link bukti screenshot (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('alasan');
      const evidence = interaction.options.getString('bukti');

      // Can't report yourself
      if (targetUser.id === interaction.user.id) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid', 'Tidak bisa melaporkan diri sendiri.')]
        });
      }

      // Can't report bots
      if (targetUser.bot) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid', 'Tidak bisa melaporkan bot.')]
        });
      }

      const result = await reportService.createReport(
        interaction.user.id,
        targetUser.id,
        interaction.guildId,
        reason,
        evidence
      );

      const embed = createReportEmbed()
        .setTitle('✅ Laporan Terkirim')
        .addFields(
          { name: '📋 Report ID', value: result.reportId, inline: true },
          { name: '👤 Dilaporkan', value: targetUser.username, inline: true },
          { name: '📊 Status', value: '⏳ Pending', inline: true },
          { name: '📝 Alasan', value: reason, inline: false }
        )
        .addFields(
          { name: '👮 Pelapor', value: interaction.user.username, inline: true },
          { name: '📅 Waktu', value: new Date().toLocaleString('id-ID'), inline: true }
        );

      if (evidence) {
        embed.addFields({ name: '🔗 Bukti', value: evidence, inline: false });
      }

      embed.addFields({
        name: '💡 Informasi',
        value: 'Laporan Anda akan ditinjau oleh moderator. Terima kasih telah melaporkan!',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

      // Send to report channel if configured
      if (config.REPORT_CHANNEL_ID) {
        try {
          const reportChannel = interaction.guild.channels.cache.get(config.REPORT_CHANNEL_ID);
          if (reportChannel) {
            const notifyEmbed = createReportEmbed()
              .setTitle('🚨 Laporan Baru')
              .addFields(
                { name: '📋 Report ID', value: result.reportId, inline: true },
                { name: '👤 Dilaporkan', value: `${targetUser.username} (${targetUser.id})`, inline: true }
              )
              .addFields(
                { name: '📝 Alasan', value: reason, inline: false },
                { name: '👮 Pelapor', value: `${interaction.user.username} (${interaction.user.id})`, inline: true }
              );

            if (evidence) {
              notifyEmbed.addFields({ name: '🔗 Bukti', value: evidence, inline: false });
            }

            await reportChannel.send({ embeds: [notifyEmbed] });
          }
        } catch (channelError) {
          console.log('Could not send to report channel');
        }
      }
    } catch (error) {
      console.error('Report user error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengirim laporan.')]
      });
    }
  }
};