import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import badWordRepository from '../../database/repositories/badWordRepository.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('badword-list')
    .setDescription('Lihat daftar kata kasar (Admin/Mod)')
    .addStringOption(option =>
      option.setName('severity')
        .setDescription('Filter berdasarkan severity')
        .setRequired(false)
        .setChoices(
          { name: '🟢 Low', value: 'low' },
          { name: '🟡 Medium', value: 'medium' },
          { name: '🟠 High', value: 'high' }
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

      const severityFilter = interaction.options.getString('severity');

      let words = badWordRepository.findByGuild(interaction.guildId);

      // Filter by severity if specified
      if (severityFilter) {
        words = words.filter(w => w.severity === severityFilter);
      }

      if (words.length === 0) {
        return await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('📋 Daftar Kata Kasar')
            .setDescription('Tidak ada kata kasar yang terdaftar.')
            .setColor(0x0099FF)
          ]
        });
      }

      // Group by severity
      const grouped = {
        high: words.filter(w => w.severity === 'high'),
        medium: words.filter(w => w.severity === 'medium'),
        low: words.filter(w => w.severity === 'low')
      };

      const embed = new EmbedBuilder()
        .setTitle('📋 Daftar Kata Kasar')
        .setColor(0x0099FF)
        .setFooter({ text: `Total: ${words.length} kata` });

      if (grouped.high.length > 0) {
        const list = grouped.high.map(w => `🟠 ${censorWord(w.word)} (+${w.points}pt)`).join('\n');
        embed.addFields({ name: `High (${grouped.high.length})`, value: list, inline: false });
      }

      if (grouped.medium.length > 0) {
        const list = grouped.medium.map(w => `🟡 ${censorWord(w.word)} (+${w.points}pt)`).join('\n');
        embed.addFields({ name: `Medium (${grouped.medium.length})`, value: list, inline: false });
      }

      if (grouped.low.length > 0) {
        const list = grouped.low.map(w => `🟢 ${censorWord(w.word)} (+${w.points}pt)`).join('\n');
        embed.addFields({ name: `Low (${grouped.low.length})`, value: list, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Badword-list command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengambil daftar kata.')]
      });
    }
  }
};

function censorWord(word) {
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}