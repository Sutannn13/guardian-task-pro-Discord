import { SlashCommandBuilder } from 'discord.js';
import badWordRepository from '../../database/repositories/badWordRepository.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('badword-add')
    .setDescription('Tambahkan kata kasar ke database (Admin/Mod)')
    .addStringOption(option =>
      option.setName('kata')
        .setDescription('Kata yang akan ditambahkan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('severity')
        .setDescription('Tingkat keparahan')
        .setRequired(false)
        .setChoices(
          { name: '🟢 Low (1 point)', value: 'low' },
          { name: '🟡 Medium (3 points)', value: 'medium' },
          { name: '🟠 High (5 points)', value: 'high' }
        )
    )
    .addIntegerOption(option =>
      option.setName('points')
        .setDescription('Custom points (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!canWarn(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menggunakan perintah ini.')]
        });
      }

      const word = interaction.options.getString('kata').toLowerCase().trim();
      const severity = interaction.options.getString('severity') || 'medium';

      // Validate word
      if (word.length < 2) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid', 'Kata terlalu pendek. Minimal 2 karakter.')]
        });
      }

      if (word.length > 50) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Invalid', 'Kata terlalu panjang. Maksimal 50 karakter.')]
        });
      }

      // Determine points
      const points = interaction.options.getInteger('points') ||
        (severity === 'low' ? 1 : severity === 'high' ? 5 : 3);

      // Check if already exists
      const existing = badWordRepository.findWord(interaction.guildId, word);
      if (existing) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Duplicate', `Kata "${censorWord(word)}" sudah ada dalam database.`)]
        });
      }

      // Add word
      badWordRepository.addWord(
        interaction.guildId,
        word,
        severity,
        points,
        interaction.user.id
      );

      const message = `Kata "${censorWord(word)}" ditambahkan.\nSeverity: ${severity}\nPoints: +${points}`;

      await interaction.editReply({
        embeds: [createSuccessEmbed('Kata Ditambahkan', message)]
      });
    } catch (error) {
      console.error('Badword-add command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menambahkan kata.')]
      });
    }
  }
};

function censorWord(word) {
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}