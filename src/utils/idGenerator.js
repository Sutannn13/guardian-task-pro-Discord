import { getAll } from '../database/db.js';

const PREFIX = {
  CASE: 'GT',
  REPORT: 'RP',
  TASK: 'TS'
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function getNextSequence(type) {
  const year = getCurrentYear();

  let table, column, prefix;
  switch (type) {
    case 'CASE':
      table = 'warnings';
      column = 'case_id';
      prefix = PREFIX.CASE;
      break;
    case 'REPORT':
      table = 'reports';
      column = 'report_id';
      prefix = PREFIX.REPORT;
      break;
    case 'TASK':
      table = 'tasks';
      column = 'task_id';
      prefix = PREFIX.TASK;
      break;
    default:
      return 1;
  }

  const pattern = `${prefix}-${year}-%`;
  const result = getAll(
    `SELECT ${column} AS code FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`,
    [pattern]
  );

  if (result.length === 0 || !result[0].code) {
    return 1;
  }

  const lastCode = result[0].code;
  const parts = lastCode.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  return lastSeq + 1;
}

function padNumber(num) {
  return num.toString().padStart(4, '0');
}

export function generateCaseId() {
  const year = getCurrentYear();
  const seq = getNextSequence('CASE');
  return `${PREFIX.CASE}-${year}-${padNumber(seq)}`;
}

export function generateReportId() {
  const year = getCurrentYear();
  const seq = getNextSequence('REPORT');
  return `${PREFIX.REPORT}-${year}-${padNumber(seq)}`;
}

export function generateTaskId() {
  const year = getCurrentYear();
  const seq = getNextSequence('TASK');
  return `${PREFIX.TASK}-${year}-${padNumber(seq)}`;
}

export default { generateCaseId, generateReportId, generateTaskId };