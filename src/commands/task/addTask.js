import { SlashCommandBuilder } from 'discord.js';
import { canManageTasks } from '../../utils/permissionUtils.js';
import taskService from '../../services/taskService.js';
import { createTaskEmbed, createErrorEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tambah-tugas')
    .setDescription('Tambah tugas baru')
    .addStringOption(option =>
      option.setName('judul')
        .setDescription('Judul tugas')
        .setRequired(true)
        .setMaxLength(200)
    )
    .addStringOption(option =>
      option.setName('deskripsi')
        .setDescription('Deskripsi tugas (opsional)')
        .setRequired(false)
        .setMaxLength(1000)
    )
    .addUserOption(option =>
      option.setName('ditugaskan')
        .setDescription('Pengguna yang ditugaskan (opsional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('deadline')
        .setDescription('Deadline (format: YYYY-MM-DD atau YYYY-MM-DD HH:MM)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('prioritas')
        .setDescription('Prioritas tugas')
        .setChoices(
          { name: '🟢 Rendah', value: 'low' },
          { name: '🟡 Normal', value: 'normal' },
          { name: '🟠 Tinggi', value: 'high' },
          { name: '🔴 Mendesak', value: 'urgent' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!canManageTasks(interaction)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menambahkan tugas.')]
        });
      }

      const title = interaction.options.getString('judul');
      const description = interaction.options.getString('deskripsi');
      const assignee = interaction.options.getUser('ditugaskan');
      const deadlineStr = interaction.options.getString('deadline');
      const priority = interaction.options.getString('prioritas') || 'normal';

      // Parse deadline
      let deadline = null;
      if (deadlineStr) {
        const parsed = new Date(deadlineStr);
        if (isNaN(parsed.getTime())) {
          return await interaction.editReply({
            embeds: [createErrorEmbed('Format Salah', 'Format deadline tidak valid. Gunakan: YYYY-MM-DD atau YYYY-MM-DD HH:MM')]
          });
        }
        deadline = parsed.toISOString();
      }

      const result = await taskService.createTask(
        title,
        description,
        interaction.guildId,
        interaction.user.id,
        assignee?.id || null,
        deadline,
        priority
      );

      const embed = createTaskEmbed()
        .setTitle('✅ Tugas Ditambahkan')
        .addFields(
          { name: '📋 Task ID', value: result.taskId, inline: true },
          { name: '📌 Judul', value: result.title, inline: true },
          { name: '⚡ Prioritas', value: priority.toUpperCase(), inline: true }
        );

      if (description) {
        embed.addFields({ name: '📝 Deskripsi', value: description, inline: false });
      }

      if (assignee) {
        embed.addFields({ name: '👤 Ditugaskan', value: assignee.username, inline: true });
      }

      if (deadline) {
        embed.addFields({ name: '📅 Deadline', value: new Date(deadline).toLocaleString('id-ID'), inline: true });
      }

      embed.addFields({ name: '👮 Dibuat Oleh', value: interaction.user.username, inline: true });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Add task error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menambahkan tugas.')]
      });
    }
  }
};