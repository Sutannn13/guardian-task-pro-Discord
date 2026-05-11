import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../utils/embedUtils.js';

const commandCategories = [
  {
    name: '🎯 Umum',
    commands: [
      { name: '/ping', desc: 'Cek latency bot' },
      { name: '/dashboard', desc: 'Tampilkan statistik server' },
      { name: '/help', desc: 'Tampilkan daftar perintah' }
    ]
  },
  {
    name: '🛡️ Moderasi',
    commands: [
      { name: '/warn', desc: 'Berikan peringatan ke pengguna' },
      { name: '/clear', desc: 'Hapus pesan di channel' },
      { name: '/log-user', desc: 'Lihat riwayat pengguna' }
    ]
  },
  {
    name: '📋 Tugas',
    commands: [
      { name: '/tambah-tugas', desc: 'Tambah tugas baru' },
      { name: '/list-tugas', desc: 'Daftar semua tugas' },
      { name: '/selesai-tugas', desc: 'Tandai tugas selesai' }
    ]
  },
  {
    name: '🚨 Lainnya',
    commands: [
      { name: '/report-user', desc: 'Laporkan pengguna bermasalah' }
    ]
  }
];

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan daftar semua perintah bot'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const embed = createInfoEmbed('📚 Daftar Perintah GuardianTask Pro');

      for (const category of commandCategories) {
        const commandList = category.commands
          .map(cmd => `**${cmd.name}** - ${cmd.desc}`)
          .join('\n');

        embed.addFields({ name: category.name, value: commandList, inline: false });
      }

      embed.addFields({
        name: '📖 Informasi',
        value: 'Gunakan perintah di atas untuk berinteraksi dengan bot. Semua perintah menggunakan slash command (/).',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Help command error:', error);
      await interaction.editReply({ content: 'Gagal menampilkan bantuan.' });
    }
  }
};