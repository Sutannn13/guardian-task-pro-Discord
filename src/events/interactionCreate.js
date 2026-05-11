import logger from '../utils/logger.js';

export async function onInteractionCreate(interaction) {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands?.get(interaction.commandName);

      if (!command) {
        logger.warn(`Command not found: ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction);
        logger.debug(`Executed command: ${interaction.commandName} by ${interaction.user.tag}`);
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);

        const errorMessage = {
          content: '⚠️ Terjadi kesalahan saat executing perintah. Silakan coba lagi.'
        };

        if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      logger.debug(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
      // Add button handlers here if needed
    }
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      logger.debug(`Select menu: ${interaction.customId} by ${interaction.user.tag}`);
      // Add select menu handlers here if needed
    }
  } catch (error) {
    logger.error('Error in interactionCreate event:', error);
  }
}

export default onInteractionCreate;