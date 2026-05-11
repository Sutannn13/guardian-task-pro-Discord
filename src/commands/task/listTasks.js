import { SlashCommandBuilder } from 'discord.js';
import taskService from '../../services/taskService.js';
import { createTaskEmbed, createInfoEmbed, createErrorEmbed } from '../../utils/embedUtils.js';
import { formatDeadline } from '../../utils/dateUtils.js';

const STATUS_EMOJI = {
  pending: '⏳',
  in_progress: '🔄',
  completed: '✅',
  cancelled: '❌'
};

const PRIORITY_EMOJI = {
  low: '🟢',
  normal: '🟡',
  high: '🟠',
  urgent: '🔴'
};

export default {
  data: new SlashCommandBuilder()
    .setName('list-tugas')
    .setDescription('Daftar semua tugas')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter berdasarkan status')
        .setRequired(false)
        .setChoices(
          { name: '⏳ Pending', value: 'pending' },
          { name: '🔄 Dalam Progress', value: 'in_progress' },
          { name: '✅ Selesai', value: 'completed' },
          { name: '❌ Dibatalkan', value: 'cancelled' },
          { name: '📋 Semua', value: 'all' }
        )
    )
    .addUserOption(option =>
      option.setName('pengguna')
        .setDescription('Tugas dari pengguna tertentu')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const statusFilter = interaction.options.getString('status');
      const userFilter = interaction.options.getUser('pengguna');

      let tasks;
      if (statusFilter && statusFilter !== 'all') {
        tasks = await taskService.getTasks(interaction.guildId, statusFilter);
      } else {
        tasks = await taskService.getTasks(interaction.guildId);
      }

      // Filter by user if specified
      if (userFilter) {
        tasks = tasks.filter(t =>
          t.creator_id === userFilter.id || t.assignee_id === userFilter.id
        );
      }

      if (tasks.length === 0) {
        return await interaction.editReply({
          embeds: [createInfoEmbed('Tidak Ada Tugas', 'Tidak ada tugas yang ditemukan.')]
        });
      }

      // Group by status
      const grouped = {
        pending: tasks.filter(t => t.status === 'pending'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        completed: tasks.filter(t => t.status === 'completed'),
        cancelled: tasks.filter(t => t.status === 'cancelled')
      };

      const embed = createTaskEmbed()
        .setTitle('📋 Daftar Tugas')
        .addFields({ name: 'Total', value: String(tasks.length), inline: true });

      // Show each status category with tasks
      for (const [status, statusTasks] of Object.entries(grouped)) {
        if (statusTasks.length > 0) {
          const taskList = statusTasks.slice(0, 10).map(t => {
            const emoji = STATUS_EMOJI[status];
            const priorityEmoji = PRIORITY_EMOJI[t.priority] || '🟡';
            return `${emoji} ${priorityEmoji} \`${t.task_id}\` - ${t.title.slice(0, 50)}${t.title.length > 50 ? '...' : ''}`;
          }).join('\n');

          const countText = statusTasks.length > 10 ? ` (menampilkan 10 dari ${statusTasks.length})` : '';
          embed.addFields({
            name: `${STATUS_EMOJI[status]} ${status.toUpperCase().replace('_', ' ')} (${statusTasks.length})${countText}`,
            value: taskList,
            inline: false
          });
        }
      }

      if (tasks.length > 20) {
        embed.setFooter({
          text: `GuardianTask Pro - Total: ${tasks.length} tugas (menampilkan 20)`
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('List tasks error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Error', error.message || 'Gagal mengambil daftar tugas.')]
      });
    }
  }
};