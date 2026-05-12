import { SlashCommandBuilder } from 'discord.js';
import badWordRepository from '../../database/repositories/badWordRepository.js';
import { canWarn } from '../../utils/permissionUtils.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('badword-remove')
    .setDescription('Hapus kata kasar dari database (Admin/Mod)')
    .addStringOption(option =>
      option.setName('kata')
        .setDescription('Kata yang akan dihapus')
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

      const word = interaction.options.getString('kata').toLowerCase().trim();

      // Check if exists
      const existing = badWordRepository.findWord(interaction.guildId, word);
      if (!existing) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Not Found', `Kata "${censorWord(word)}" tidak ditemukan dalam database.`)]
        });
      }

      // Remove word
      badWordRepository.removeWord(interaction.guildId, word);

      await interaction.editReply({
        embeds: [createSuccessEmbed('Kata Dihapus', `Kata "${censorWord(word)}" telah dihapus dari database.`)]
      });
    } catch (error) {
      console.error('Badword-remove command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menghapus kata.')]
      });
    }
  }
};

function censorWord(word) {
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}