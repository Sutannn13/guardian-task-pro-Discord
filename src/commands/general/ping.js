import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../utils/embedUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek latency dan status bot'),

  async execute(interaction) {
    const start = Date.now();
    await interaction.deferReply();
    const latency = Date.now() - start;

    const wsLatency = interaction.client.ws.ping;

    const embed = createInfoEmbed('Pong! 🏓')
      .addFields(
        { name: 'Latency', value: `${latency}ms`, inline: true },
        { name: 'WebSocket Ping', value: `${wsLatency}ms`, inline: true },
        { name: 'Status', value: '🟢 Online', inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};