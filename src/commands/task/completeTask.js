import { SlashCommandBuilder } from 'discord.js';
import { canCompleteTask } from '../../utils/permissionUtils.js';
import taskService from '../../services/taskService.js';
import taskRepository from '../../database/repositories/taskRepository.js';
import { createTaskEmbed, createErrorEmbed, createSuccessEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('selesai-tugas')
    .setDescription('Tandai tugas sebagai selesai')
    .addStringOption(option =>
      option.setName('task_id')
        .setDescription('ID tugas yang akan ditandai selesai')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const taskId = interaction.options.getString('task_id');

      // Find the task
      const task = taskRepository.findByTaskId(taskId);

      if (!task) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Ditemukan', `Tugas dengan ID \`${taskId}\` tidak ditemukan.`)]
        });
      }

      // Check permission
      if (!canCompleteTask(interaction, task)) {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Tidak Punya Izin', 'Anda tidak memiliki izin untuk menyelesaikan tugas ini.')]
        });
      }

      // Check if already completed or cancelled
      if (task.status === 'completed') {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Sudah Selesai', 'Tugas ini sudah ditandai selesai.')]
        });
      }

      if (task.status === 'cancelled') {
        return await interaction.editReply({
          embeds: [createErrorEmbed('Dibatalkan', 'Tugas ini sudah dibatalkan.')]
        });
      }

      const result = await taskService.completeTask(taskId, interaction.user.id, interaction.guildId);

      const embed = createTaskEmbed()
        .setTitle('✅ Tugas Selesai')
        .addFields(
          { name: '📋 Task ID', value: taskId, inline: true },
          { name: '📌 Judul', value: task.title, inline: false }
        )
        .addFields(
          { name: '👮 Oleh', value: interaction.user.username, inline: true },
          { name: '📅 Waktu', value: new Date().toLocaleString('id-ID'), inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Complete task error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal menyelesaikan tugas.')]
      });
    }
  }
};