import { SlashCommandBuilder } from 'discord.js';
import { canClear } from '../../utils/permissionUtils.js';
import { createModerationEmbed, createErrorEmbed } from '../../utils/embedUtils.js';
import auditLogService from '../../services/auditLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Hapus pesan di channel')
    .addIntegerOption(option =>
      option.setName('jumlah')
        .setDescription('Jumlah pesan yang akan dihapus (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Hapus pesan dari pengguna tertentu saja')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!canClear(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menggunakan perintah ini.')]
        });
      }

      const amount = interaction.options.getInteger('jumlah');
      const targetUser = interaction.options.getUser('target');

      const channel = interaction.channel;

      // Fetch messages
      const messages = await channel.messages.fetch({ limit: amount });

      let deletedCount = 0;

      if (targetUser) {
        // Delete only messages from target user
        const filteredMessages = messages.filter(msg => msg.author.id === targetUser.id);
        for (const message of filteredMessages.values()) {
          try {
            await message.delete();
            deletedCount++;
          } catch (deleteError) {
            // Skip messages that can't be deleted
          }
        }
      } else {
        // Delete all messages
        const bulkDelete = await channel.bulkDelete(amount, true);
        deletedCount = bulkDelete.size;
      }

      await auditLogService.logAction(
        'MESSAGES_CLEARED',
        interaction.user.id,
        targetUser?.id || null,
        interaction.guildId,
        { amount: deletedCount, targetUser: targetUser?.id }
      );

      const embed = createModerationEmbed()
        .setTitle('🗑️ Pesan Dihapus')
        .addFields(
          { name: '📊 Jumlah', value: String(deletedCount), inline: true },
          { name: '📁 Channel', value: channel.name, inline: true },
          { name: '👮 Oleh', value: interaction.user.username, inline: true }
        );

      if (targetUser) {
        embed.addFields({ name: '👤 Target', value: targetUser.username, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

      // Auto delete confirmation after 3 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (timeoutError) {
          // Ignore
        }
      }, 3000);
    } catch (error) {
      console.error('Clear command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menghapus pesan.')]
      });
    }
  }
};