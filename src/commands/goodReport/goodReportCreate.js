import { SlashCommandBuilder } from 'discord.js';
import goodReportRepository from '../../database/repositories/goodReportRepository.js';
import { generateGoodReportId } from '../../utils/idGenerator.js';
import config from '../../config/env.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lapor-baik')
    .setDescription('Laporkan perilaku baik user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang dilaporkan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('alasan')
        .setDescription('Alasan laporan')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('alasan');

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

      // Check cooldown
      const canReport = goodReportRepository.canCreateReport(
        interaction.user.id,
        targetUser.id,
        interaction.guildId,
        6 // 6 hours cooldown
      );

      if (!canReport) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Cooldown', 'Anda sudah melaporkan user ini recently. Tunggu 6 jam sebelum membuat laporan lagi.')]
        });
      }

      // Create good report
      const reportId = generateGoodReportId();
      goodReportRepository.create(
        reportId,
        interaction.guildId,
        interaction.user.id,
        targetUser.id,
        reason,
        config.GOOD_REPORT_REDUCTION_POINTS
      );

      const message = `✅ Laporan baik untuk <@${targetUser.id}> telah dikirim.\n\n`;
      message += `📋 Report ID: \`${reportId}\`\n`;
      message += `📝 Alasan: ${reason}\n\n`;
      message += `Status: ⏳ Pending\n`;
      message += `Poin pengurangan jika disetujui: -${config.GOOD_REPORT_REDUCTION_POINTS}`;

      await interaction.editReply({
        embeds: [createSuccessEmbed('Laporan Baik Dikirim', message)]
      });

      // Notify mod channel
      if (config.MOD_LOG_CHANNEL_ID) {
        const channel = interaction.guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
        if (channel && channel.isTextBased()) {
          const notifyEmbed = new (await import('discord.js')).EmbedBuilder()
            .setTitle('⭐ Laporan Baik Baru')
            .setColor(0x00FF00)
            .addFields(
              { name: 'Pelapor', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Target', value: `<@${targetUser.id}>`, inline: true },
              { name: 'Report ID', value: reportId, inline: true }
            )
            .addFields({ name: 'Alasan', value: reason, inline: false })
            .setFooter({ text: 'GuardianTask Pro - Good Report' });

          await channel.send({ embeds: [notifyEmbed] });
        }
      }
    } catch (error) {
      console.error('Lapor-baik command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengirim laporan.')]
      });
    }
  }
};