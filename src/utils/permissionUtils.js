import config from '../config/env.js';

export function canWarn(interaction) {
  const member = interaction.member;
  if (!member) return false;

  if (member.permissions.has('Administrator')) return true;
  if (member.permissions.has('ModerateMembers')) return true;
  if (member.permissions.has('ManageMessages')) return true;

  const roleIds = member.roles.cache.map(role => role.id);
  if (config.TASK_MANAGER_ROLE_IDS.length > 0) {
    return roleIds.some(id => config.TASK_MANAGER_ROLE_IDS.includes(id));
  }

  return false;
}

export function canClear(interaction) {
  const member = interaction.member;
  if (!member) return false;

  if (member.permissions.has('Administrator')) return true;
  if (member.permissions.has('ManageMessages')) return true;

  return false;
}

export function canManageTasks(interaction) {
  const member = interaction.member;
  if (!member) return false;

  if (member.permissions.has('Administrator')) return true;
  if (member.permissions.has('ManageGuild')) return true;

  const roleIds = member.roles.cache.map(role => role.id);
  return roleIds.some(id => config.TASK_MANAGER_ROLE_IDS.includes(id));
}

export function canCompleteTask(interaction, task) {
  const member = interaction.member;
  if (!member) return false;

  if (member.permissions.has('Administrator')) return true;

  const roleIds = member.roles.cache.map(role => role.id);
  if (roleIds.some(id => config.TASK_MANAGER_ROLE_IDS.includes(id))) return true;

  if (task.creator_id === member.id) return true;
  if (task.assignee_id === member.id) return true;

  return false;
}

export function isOwner(interaction) {
  if (!config.OWNER_ID) return false;
  return interaction.user.id === config.OWNER_ID;
}

export function hasRole(interaction, roleName) {
  const member = interaction.member;
  if (!member) return false;
  return member.roles.cache.some(role => role.name.toLowerCase() === roleName.toLowerCase());
}

export default { canWarn, canClear, canManageTasks, canCompleteTask, isOwner, hasRole };