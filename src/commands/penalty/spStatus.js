import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import penaltyService from '../../services/penaltyService.js';
import { canWarn } from '../../utils/permissionUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sp-status')
    .setDescription('Melihat status SP user')
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

      // Determine SP status
      let spStatus, spColor, spDescription;

      if (status.sp_level === 0) {
        spStatus = '🟢 Tidak ada SP';
        spColor = 0x00FF00;
        spDescription = 'User belum menerima SP manapun.';
      } else if (status.sp_level === 1) {
        spStatus = '🟡 SP1 Aktif';
        spColor = 0xFFAA00;
        spDescription = 'User sedang dalam masa SP1.\nThreshold sekarang: 20 points.\nJika melanggar lagi, akan menerima SP2.';
      } else if (status.sp_level === 2) {
        spStatus = '🟠 SP2 Aktif';
        spColor = 0xFF6600;
        spDescription = 'User sedang dalam masa SP2.\nWarning! Jika melanggar lagi, akan ada sanksi final.';
      } else {
        spStatus = '🔴 Final Warning';
        spColor = 0xFF0000;
        spDescription = 'User dalam tahap akhir. Sanksi selanjutnya adalah kick.';
      }

      const embed = new EmbedBuilder()
        .setTitle(`📋 SP Status: ${targetUser.username}`)
        .setColor(spColor)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'SP Level', value: spStatus, inline: true },
          { name: 'Penalty Points', value: `${status.penalty_points}/${status.threshold}`, inline: true }
        )
        .addFields(
          { name: 'Progress', value: `\`${'█'.repeat(Math.round(status.progress / 10))}${'░'.repeat(10 - Math.round(status.progress / 10))}\` ${status.progress}%`, inline: false }
        )
        .addFields(
          { name: 'Status', value: spDescription, inline: false }
        );

      // Add next sanction info
      if (status.sp_level === 0) {
        embed.addFields({
          name: '⚠️ Next Sanction',
          value: `Jika penalty mencapai ${status.threshold}, akan menerima SP1.`,
          inline: false
        });
      } else if (status.sp_level === 1) {
        embed.addFields({
          name: '⚠️ Next Sanction',
          value: `Jika penalty mencapai 20, akan menerima SP2.`,
          inline: false
        });
      } else if (status.sp_level >= 2) {
        embed.addFields({
          name: '🚫 Final Sanction',
          value: `Jika penalty mencapai 20 lagi, user akan dikick atau direkomendasikan untuk di-kick.`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('SP status command error:', error);
      await interaction.editReply({ content: 'Gagal mengambil SP status.' });
    }
  }
};