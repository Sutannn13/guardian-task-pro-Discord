import { EmbedBuilder } from 'discord.js';

const COLORS = {
  SUCCESS: 0x00FF00,
  ERROR: 0xFF0000,
  WARNING: 0xFFAA00,
  INFO: 0x0099FF,
  DASHBOARD: 0x9933FF,
  MODERATION: 0xFF6600,
  TASK: 0x00CC66,
  REPORT: 0xCC0000
};

const FOOTER_TEXT = 'GuardianTask Pro - Smart Discord Assistant';

function createBaseEmbed(color = COLORS.INFO) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

export function createSuccessEmbed(title, description = '') {
  return createBaseEmbed(COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

export function createErrorEmbed(title, description = '') {
  return createBaseEmbed(COLORS.ERROR)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

export function createWarningEmbed(title, description = '') {
  return createBaseEmbed(COLORS.WARNING)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

export function createInfoEmbed(title, description = '') {
  return createBaseEmbed(COLORS.INFO)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description);
}

export function createDashboardEmbed() {
  return createBaseEmbed(COLORS.DASHBOARD)
    .setTitle('📊 Dashboard');
}

export function createModerationEmbed() {
  return createBaseEmbed(COLORS.MODERATION)
    .setTitle('🛡️ Moderasi');
}

export function createTaskEmbed() {
  return createBaseEmbed(COLORS.TASK)
    .setTitle('📋 Tugas');
}

export function createReportEmbed() {
  return createBaseEmbed(COLORS.REPORT)
    .setTitle('🚨 Laporan');
}

export default {
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  createDashboardEmbed,
  createModerationEmbed,
  createTaskEmbed,
  createReportEmbed,
  COLORS
};